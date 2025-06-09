import { EventEmitter } from 'events';
import * as SecureStore from 'expo-secure-store';

export interface MarketPrice {
  date: Date;
  category: string;
  weight: number;
  price: number;
  volume: number;
  trend: 'up' | 'down' | 'stable';
  location: string;
}

export interface MarketTrend {
  category: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  prices: MarketPrice[];
  average: number;
  change: number;
  changePercentage: number;
}

export interface MarketPreferences {
  apiKey: string;
  updateInterval: number; // minutes
  categories: string[];
  locations: string[];
  notifications: {
    enabled: boolean;
    threshold: number; // percentage change
    categories: string[];
  };
}

export class MarketDataService {
  private static instance: MarketDataService;
  private eventEmitter: EventEmitter;
  private preferences: MarketPreferences;
  private readonly PREFERENCES_KEY = 'market_preferences';
  private updateInterval?: NodeJS.Timeout;

  private constructor() {
    this.eventEmitter = new EventEmitter();
    this.preferences = this.getDefaultPreferences();
    this.initialize();
  }

  static getInstance(): MarketDataService {
    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService();
    }
    return MarketDataService.instance;
  }

  private getDefaultPreferences(): MarketPreferences {
    return {
      apiKey: '',
      updateInterval: 60,
      categories: ['feeder', 'slaughter', 'replacement'],
      locations: ['national', 'regional'],
      notifications: {
        enabled: true,
        threshold: 5,
        categories: ['feeder', 'slaughter'],
      },
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
      console.error('Error initializing market data service:', error);
    }
  }

  async getPreferences(): Promise<MarketPreferences> {
    return { ...this.preferences };
  }

  async updatePreferences(updates: Partial<MarketPreferences>): Promise<void> {
    try {
      this.preferences = { ...this.preferences, ...updates };
      await this.savePreferences();
      this.restartUpdates();
    } catch (error) {
      console.error('Error updating market preferences:', error);
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
      console.error('Error saving market preferences:', error);
      throw error;
    }
  }

  private async loadPreferences(): Promise<MarketPreferences | null> {
    try {
      const preferencesJson = await SecureStore.getItemAsync(this.PREFERENCES_KEY);
      return preferencesJson ? JSON.parse(preferencesJson) : null;
    } catch (error) {
      console.error('Error loading market preferences:', error);
      return null;
    }
  }

  private startUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(
      () => this.fetchMarketData(),
      this.preferences.updateInterval * 60 * 1000
    );
  }

  private restartUpdates() {
    this.startUpdates();
  }

  private async fetchMarketData() {
    try {
      // TODO: Implement actual API calls to market data service
      // This would typically involve:
      // 1. Fetching current prices for all categories
      // 2. Calculating trends
      // 3. Checking for significant changes
      // 4. Emitting events with the data

      this.eventEmitter.emit('marketDataUpdated', {
        // market data
      });
    } catch (error) {
      console.error('Error fetching market data:', error);
    }
  }

  async getCurrentPrices(category?: string): Promise<MarketPrice[]> {
    // TODO: Implement actual API call
    throw new Error('Not implemented');
  }

  async getMarketTrends(
    category: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  ): Promise<MarketTrend> {
    // TODO: Implement actual API call
    throw new Error('Not implemented');
  }

  async getPriceAlerts(): Promise<MarketPrice[]> {
    // TODO: Implement actual API call
    throw new Error('Not implemented');
  }

  // Event Handling
  onMarketDataUpdated(callback: (data: any) => void): () => void {
    this.eventEmitter.on('marketDataUpdated', callback);
    return () => {
      this.eventEmitter.off('marketDataUpdated', callback);
    };
  }

  onPriceAlert(callback: (price: MarketPrice) => void): () => void {
    this.eventEmitter.on('priceAlert', callback);
    return () => {
      this.eventEmitter.off('priceAlert', callback);
    };
  }
} 