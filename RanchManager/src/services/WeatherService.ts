import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { format, subDays, addDays, differenceInDays } from 'date-fns';
import { Pasture } from '../store/types/grazing';
import { WeatherData } from '../types/weather';

// Types
export interface ForecastData {
  date: string;
  maxTemp: number;
  minTemp: number;
  condition: string;
  precipitation: number;
}

interface PastureWeatherData {
  pastureId: string;
  current: WeatherData;
  forecast: ForecastData[];
  historical: WeatherData[];
  metrics: {
    growingDegreeDays: number;
    moistureDeficit: number;
    recoveryRate: number;
    growingSeasonLength: number;
  };
}

interface WeatherAlert {
  id: string;
  type: 'severe' | 'drought' | 'frost' | 'heat';
  severity: 'low' | 'moderate' | 'high' | 'extreme';
  message: string;
  startTime: number;
  endTime: number;
  affectedPastures: string[];
}

interface DroughtIndex {
  pastureId: string;
  index: number;
  category: 'none' | 'abnormally_dry' | 'moderate' | 'severe' | 'extreme' | 'exceptional';
  lastUpdated: number;
}

// Constants
const WEATHER_API_KEY = 'YOUR_API_KEY'; // Replace with your actual API key
const WEATHER_API_URL = 'https://api.weatherapi.com/v1';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const FORECAST_CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours
const HISTORICAL_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const CACHE_KEYS = {
  CURRENT: 'weather_current',
  FORECAST: 'weather_forecast',
  HISTORICAL: 'weather_historical',
  ALERTS: 'weather_alerts',
  DROUGHT: 'weather_drought',
  PASTURE: 'weather_pasture_'
};

// Utility Functions
const calculateGrowingDegreeDays = (highTemp: number, lowTemp: number, baseTemp: number = 50): number => {
  const avgTemp = (highTemp + lowTemp) / 2;
  return Math.max(0, avgTemp - baseTemp);
};

const calculateEvapotranspiration = (
  temperature: number,
  humidity: number,
  windSpeed: number,
  solarRadiation: number
): number => {
  // Simplified Penman-Monteith equation
  const slope = 4098 * (0.6108 * Math.exp((17.27 * temperature) / (temperature + 237.3))) / Math.pow(temperature + 237.3, 2);
  const psychrometricConstant = 0.665 * 0.001 * 101.3;
  const vaporPressureDeficit = 0.6108 * Math.exp((17.27 * temperature) / (temperature + 237.3)) * (1 - humidity / 100);
  
  return (
    (0.408 * slope * solarRadiation + psychrometricConstant * (900 / (temperature + 273)) * windSpeed * vaporPressureDeficit) /
    (slope + psychrometricConstant * (1 + 0.34 * windSpeed))
  );
};

const estimateSoilTemperature = (airTemp: number, solarRadiation: number, precipitation: number): number => {
  // Simple soil temperature estimation model
  const baseTemp = airTemp;
  const solarEffect = solarRadiation * 0.1;
  const precipitationEffect = precipitation > 0 ? -2 : 0;
  return baseTemp + solarEffect + precipitationEffect;
};

class WeatherService {
  private static instance: WeatherService;
  private cache: Map<string, { data: WeatherData; timestamp: number }> = new Map();
  private isOnline: boolean = true;
  private lastUpdate: { [key: string]: number } = {};
  private retryCount: { [key: string]: number } = {};
  private readonly maxRetries = 3;
  private apiKey: string;
  private baseUrl: string;

  private constructor() {
    this.apiKey = process.env.WEATHER_API_KEY || '';
    this.baseUrl = 'https://api.weatherapi.com/v1';
    this.initializeConnectivityListener();
  }

  public static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  private async initializeConnectivityListener(): Promise<void> {
    const unsubscribe = NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? false;
      if (this.isOnline) {
        this.syncOfflineData();
      }
    });
  }

  private async syncOfflineData(): Promise<void> {
    try {
      const offlineData = await AsyncStorage.getItem('offline_weather_data');
      if (offlineData) {
        const data = JSON.parse(offlineData);
        // Implement sync logic with backend
        await AsyncStorage.removeItem('offline_weather_data');
      }
    } catch (error) {
      console.error('Error syncing offline data:', error);
    }
  }

  private async makeApiRequest<T>(
    endpoint: string,
    params: any,
    cacheKey: string,
    cacheDuration: number
  ): Promise<T> {
    if (!this.isOnline) {
      return this.getCachedData<T>(cacheKey);
    }

    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        params: { ...params, key: this.apiKey },
        timeout: 10000
      });

      await this.cacheData(cacheKey, response.data, cacheDuration);
      this.lastUpdate[cacheKey] = Date.now();
      this.retryCount[cacheKey] = 0;

      return response.data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      
      if (this.retryCount[cacheKey] < this.maxRetries) {
        this.retryCount[cacheKey] = (this.retryCount[cacheKey] || 0) + 1;
        return this.makeApiRequest<T>(endpoint, params, cacheKey, cacheDuration);
      }

      return this.getCachedData<T>(cacheKey);
    }
  }

  private async cacheData<T>(key: string, data: T, duration: number): Promise<void> {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + duration
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  private async getCachedData<T>(key: string): Promise<T> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const { data, expiresAt } = JSON.parse(cached);
        if (Date.now() < expiresAt) {
          return data;
        }
      }
      throw new Error('Cache expired or not found');
    } catch (error) {
      console.error('Error retrieving cached data:', error);
      throw error;
    }
  }

  public async getCurrentWeather(latitude: number, longitude: number): Promise<WeatherData> {
    const cacheKey = `weather_${latitude},${longitude}`;
    const cachedData = await this.getCachedData<WeatherData>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    if (!(await this.checkConnectivity())) {
      throw new Error('No network connection available');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/current.json`, {
        params: {
          key: this.apiKey,
          q: `${latitude},${longitude}`,
          aqi: 'no',
        },
      });

      const data = response.data;
      const weatherData: WeatherData = {
        temperature: data.current.temp_c,
        condition: data.current.condition.text,
        humidity: data.current.humidity,
        windSpeed: data.current.wind_kph,
        precipitation: data.current.precip_mm,
        uvIndex: data.current.uv,
        timestamp: new Date(data.current.last_updated_epoch * 1000).toISOString(),
      };

      await this.cacheData(cacheKey, weatherData, CACHE_DURATION);
      return weatherData;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw error;
    }
  }

  public async getForecast(latitude: number, longitude: number, days: number = 7): Promise<WeatherData[]> {
    const cacheKey = `forecast_${latitude},${longitude}_${days}`;
    const cachedData = await this.getCachedData<WeatherData[]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    if (!(await this.checkConnectivity())) {
      throw new Error('No network connection available');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/forecast.json`, {
        params: {
          key: this.apiKey,
          q: `${latitude},${longitude}`,
          days,
          aqi: 'no',
          alerts: 'no',
        },
      });

      const forecastData: WeatherData[] = response.data.forecast.forecastday.map((day: any) => ({
        temperature: day.day.avgtemp_c,
        condition: day.day.condition.text,
        humidity: day.day.avghumidity,
        windSpeed: day.day.maxwind_kph,
        precipitation: day.day.totalprecip_mm,
        uvIndex: day.day.uv,
        timestamp: new Date(day.date_epoch * 1000).toISOString(),
      }));

      const weatherData: WeatherData = {
        temperature: response.data.current.temp_c,
        condition: response.data.current.condition.text,
        humidity: response.data.current.humidity,
        windSpeed: response.data.current.wind_kph,
        precipitation: response.data.current.precip_mm,
        uvIndex: response.data.current.uv,
        timestamp: new Date(response.data.current.last_updated_epoch * 1000).toISOString(),
      };

      await this.cacheData(cacheKey, forecastData, FORECAST_CACHE_DURATION);
      return forecastData;
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      throw error;
    }
  }

  public async getHistoricalData(
    latitude: number,
    longitude: number,
    startDate: Date,
    endDate: Date
  ): Promise<WeatherData[]> {
    return this.makeApiRequest<WeatherData[]>(
      '/historical',
      {
        lat: latitude,
        lon: longitude,
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd')
      },
      CACHE_KEYS.HISTORICAL,
      HISTORICAL_CACHE_DURATION
    );
  }

  public async getWeatherAlerts(latitude: number, longitude: number): Promise<WeatherAlert[]> {
    return this.makeApiRequest<WeatherAlert[]>(
      '/alerts',
      { lat: latitude, lon: longitude },
      CACHE_KEYS.ALERTS,
      CACHE_DURATION
    );
  }

  public async getDroughtIndex(pastureId: string): Promise<DroughtIndex> {
    return this.makeApiRequest<DroughtIndex>(
      '/drought',
      { pastureId },
      `${CACHE_KEYS.DROUGHT}${pastureId}`,
      CACHE_DURATION
    );
  }

  public async getPastureWeatherData(pasture: Pasture): Promise<PastureWeatherData> {
    const cacheKey = `${CACHE_KEYS.PASTURE}${pasture.id}`;
    
    try {
      const [current, forecast, historical] = await Promise.all([
        this.getCurrentWeather(pasture.boundaries[0].latitude, pasture.boundaries[0].longitude),
        this.getForecast(pasture.boundaries[0].latitude, pasture.boundaries[0].longitude, 7),
        this.getHistoricalData(
          pasture.boundaries[0].latitude,
          pasture.boundaries[0].longitude,
          subDays(new Date(), 30),
          new Date()
        )
      ]);

      const metrics = this.calculatePastureMetrics(historical, forecast);

      const pastureData: PastureWeatherData = {
        pastureId: pasture.id,
        current,
        forecast,
        historical,
        metrics
      };

      await this.cacheData(cacheKey, pastureData, CACHE_DURATION);
      return pastureData;
    } catch (error) {
      console.error('Error getting pasture weather data:', error);
      return this.getCachedData<PastureWeatherData>(cacheKey);
    }
  }

  private calculatePastureMetrics(
    historical: WeatherData[],
    forecast: WeatherData[]
  ): PastureWeatherData['metrics'] {
    const growingDegreeDays = historical.reduce((sum, day) => {
      return sum + calculateGrowingDegreeDays(day.temperature, day.temperature - 10);
    }, 0);

    const moistureDeficit = historical.reduce((sum, day) => {
      const et = calculateEvapotranspiration(
        day.temperature,
        day.humidity,
        day.windSpeed,
        day.temperature
      );
      return sum + (et - day.precipitation);
    }, 0);

    const recoveryRate = this.calculateRecoveryRate(historical);
    const growingSeasonLength = this.estimateGrowingSeasonLength(historical, forecast);

    return {
      growingDegreeDays,
      moistureDeficit,
      recoveryRate,
      growingSeasonLength
    };
  }

  private calculateRecoveryRate(historical: WeatherData[]): number {
    // Calculate pasture recovery rate based on temperature, precipitation, and soil conditions
    const recentData = historical.slice(-7); // Last 7 days
    const avgTemp = recentData.reduce((sum, day) => sum + day.temperature, 0) / recentData.length;
    const totalPrecip = recentData.reduce((sum, day) => sum + day.precipitation, 0);
    const avgSoilTemp = recentData.reduce((sum, day) => sum + (day.soilTemperature || 0), 0) / recentData.length;

    // Simple recovery rate model
    const tempFactor = Math.max(0, Math.min(1, (avgTemp - 40) / 30));
    const precipFactor = Math.min(1, totalPrecip / 50);
    const soilFactor = Math.max(0, Math.min(1, (avgSoilTemp - 40) / 30));

    return (tempFactor + precipFactor + soilFactor) / 3;
  }

  private estimateGrowingSeasonLength(
    historical: WeatherData[],
    forecast: WeatherData[]
  ): number {
    const allData = [...historical, ...forecast];

    const growingDays = allData.filter(day => day.temperature >= 50).length;
    return growingDays;
  }

  public async getFrostRisk(pasture: Pasture): Promise<number> {
    const forecast = await this.getForecast(pasture.boundaries[0].latitude, pasture.boundaries[0].longitude, 7);

    const risk = forecast.reduce((maxRisk, day) => {
      if (day.minTemp <= 32) {
        return Math.max(maxRisk, (32 - day.minTemp) / 10);
      }
      return maxRisk;
    }, 0);

    return Math.min(1, risk);
  }

  public async getHeatStressRisk(pasture: Pasture): Promise<number> {
    const forecast = await this.getForecast(pasture.boundaries[0].latitude, pasture.boundaries[0].longitude, 7);

    const risk = forecast.reduce((maxRisk, day) => {
      if (day.maxTemp >= 85) {
        return Math.max(maxRisk, (day.maxTemp - 85) / 20);
      }
      return maxRisk;
    }, 0);

    return Math.min(1, risk);
  }

  public async getClimateTrends(
    pasture: Pasture,
    years: number = 5
  ): Promise<{
    temperatureTrend: number;
    precipitationTrend: number;
    growingSeasonTrend: number;
  }> {
    const endDate = new Date();
    const startDate = subDays(endDate, years * 365);

    const historical = await this.getHistoricalData(
      pasture.boundaries[0].latitude,
      pasture.boundaries[0].longitude,
      startDate,
      endDate
    );

    // Calculate trends using linear regression
    const temperatureTrend = this.calculateTrend(
      historical.map(h => ({ x: h.timestamp, y: h.temperature }))
    );
    const precipitationTrend = this.calculateTrend(
      historical.map(h => ({ x: h.timestamp, y: h.precipitation }))
    );
    const growingSeasonTrend = this.calculateTrend(
      historical.map(h => ({ x: h.timestamp, y: h.growingDegreeDays || 0 }))
    );

    return {
      temperatureTrend,
      precipitationTrend,
      growingSeasonTrend
    };
  }

  private calculateTrend(points: { x: number; y: number }[]): number {
    const n = points.length;
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  private async checkConnectivity(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected ?? false;
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
    try {
      const keys = await AsyncStorage.getAllKeys();
      const weatherKeys = keys.filter(key => key.startsWith('weather_'));
      await AsyncStorage.multiRemove(weatherKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

export default WeatherService.getInstance(); 