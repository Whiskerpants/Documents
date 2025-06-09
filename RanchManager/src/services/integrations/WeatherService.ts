import { EventEmitter } from 'events';
import { SecureStore } from 'expo-secure-store';
import { LocationService } from '../LocationService';

export interface WeatherAlert {
  id: string;
  type: 'severe' | 'warning' | 'advisory';
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  severity: number;
  affectedAreas: string[];
}

export interface WeatherForecast {
  date: Date;
  temperature: {
    min: number;
    max: number;
    current: number;
  };
  precipitation: {
    probability: number;
    amount: number;
  };
  wind: {
    speed: number;
    direction: string;
  };
  conditions: string;
  humidity: number;
  uvIndex: number;
}

export interface WeatherPreferences {
  apiKey: string;
  units: 'metric' | 'imperial';
  updateInterval: number; // minutes
  alertsEnabled: boolean;
  alertTypes: string[];
  locationOverride?: {
    latitude: number;
    longitude: number;
  };
}

export class WeatherService {
  private static instance: WeatherService;
  private eventEmitter: EventEmitter;
  private locationService: LocationService;
  private preferences: WeatherPreferences;
  private readonly PREFERENCES_KEY = 'weather_preferences';
  private updateInterval?: NodeJS.Timeout;

  private constructor() {
    this.eventEmitter = new EventEmitter();
    this.locationService = LocationService.getInstance();
    this.preferences = this.getDefaultPreferences();
    this.initialize();
  }

  static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  private getDefaultPreferences(): WeatherPreferences {
    return {
      apiKey: '',
      units: 'metric',
      updateInterval: 30,
      alertsEnabled: true,
      alertTypes: ['severe', 'warning', 'advisory'],
    };
  }

  private async initialize() {
    try {
      const savedPreferences = await this.loadPreferences();
      if (savedPreferences) {
        this.preferences = { ...this.preferences, ...savedPreferences };
      }
      this.startUpdates();
    } catch (error) {
      console.error('Error initializing weather service:', error);
    }
  }

  async getPreferences(): Promise<WeatherPreferences> {
    return { ...this.preferences };
  }

  async updatePreferences(updates: Partial<WeatherPreferences>): Promise<void> {
    try {
      this.preferences = { ...this.preferences, ...updates };
      await this.savePreferences();
      this.restartUpdates();
    } catch (error) {
      console.error('Error updating weather preferences:', error);
      throw error;
    }
  }

  private async savePreferences(): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        this.PREFERENCES_KEY,
        JSON.stringify(this.preferences)
      );
    } catch (error) {
      console.error('Error saving weather preferences:', error);
      throw error;
    }
  }

  private async loadPreferences(): Promise<WeatherPreferences | null> {
    try {
      const preferencesJson = await SecureStore.getItemAsync(this.PREFERENCES_KEY);
      return preferencesJson ? JSON.parse(preferencesJson) : null;
    } catch (error) {
      console.error('Error loading weather preferences:', error);
      return null;
    }
  }

  private startUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(
      () => this.fetchWeatherData(),
      this.preferences.updateInterval * 60 * 1000
    );
  }

  private restartUpdates() {
    this.startUpdates();
  }

  private async fetchWeatherData() {
    try {
      const location = this.preferences.locationOverride || await this.locationService.getCurrentLocation();
      if (!location) return;

      // TODO: Implement actual API calls to weather service
      // This would typically involve:
      // 1. Fetching current conditions
      // 2. Fetching forecast
      // 3. Checking for alerts
      // 4. Emitting events with the data

      this.eventEmitter.emit('weatherUpdated', {
        // weather data
      });
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  }

  async getCurrentWeather(): Promise<WeatherForecast> {
    // TODO: Implement actual API call
    throw new Error('Not implemented');
  }

  async getForecast(days: number = 7): Promise<WeatherForecast[]> {
    // TODO: Implement actual API call
    throw new Error('Not implemented');
  }

  async getAlerts(): Promise<WeatherAlert[]> {
    // TODO: Implement actual API call
    throw new Error('Not implemented');
  }

  // Event Handling
  onWeatherUpdated(callback: (data: any) => void): () => void {
    this.eventEmitter.on('weatherUpdated', callback);
    return () => {
      this.eventEmitter.off('weatherUpdated', callback);
    };
  }

  onAlertReceived(callback: (alert: WeatherAlert) => void): () => void {
    this.eventEmitter.on('alertReceived', callback);
    return () => {
      this.eventEmitter.off('alertReceived', callback);
    };
  }
} 