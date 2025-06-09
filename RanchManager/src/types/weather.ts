export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  uvIndex: number;
  timestamp: string;
}

export interface PastureWeatherData {
  current: WeatherData;
  forecast: WeatherData[];
  historical: WeatherData[];
  metrics: {
    growingDegreeDays: number;
    precipitationTotal: number;
    droughtRisk: number;
    frostRisk: number;
    heatStressRisk: number;
    growingSeasonLength: number;
  };
} 