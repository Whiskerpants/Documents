import * as SecureStore from 'expo-secure-store';
import { EventEmitter } from 'events';
import { AuthService } from './AuthService';
import { PerformanceService } from './performanceService';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Language = 'en' | 'es' | 'fr';
export type SyncFrequency = 'manual' | 'hourly' | 'daily' | 'weekly';

export interface GeneralPreferences {
  theme: ThemeMode;
  language: Language;
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
    email: boolean;
  };
  accessibility: {
    fontSize: number;
    highContrast: boolean;
    reducedMotion: boolean;
  };
}

export interface ModulePreferences {
  cattle: {
    defaultView: 'list' | 'grid' | 'map';
    sortBy: 'name' | 'age' | 'health' | 'value';
    showInactive: boolean;
    customFields: string[];
  };
  health: {
    alertThresholds: {
      weight: number;
      temperature: number;
      heartRate: number;
    };
    defaultVet: string;
    autoSchedule: boolean;
  };
  financial: {
    currency: string;
    fiscalYearStart: string;
    defaultTaxRate: number;
    showProjections: boolean;
  };
}

export interface DataPreferences {
  backup: {
    frequency: SyncFrequency;
    includeMedia: boolean;
    compression: boolean;
    retention: number; // days
  };
  sync: {
    frequency: SyncFrequency;
    onCellular: boolean;
    onBattery: boolean;
    conflictResolution: 'local' | 'remote' | 'newest';
  };
  storage: {
    maxCacheSize: number;
    autoCleanup: boolean;
    mediaQuality: 'high' | 'medium' | 'low';
  };
}

export interface PerformancePreferences {
  dataRefresh: {
    frequency: number; // minutes
    backgroundSync: boolean;
    prefetch: boolean;
  };
  animations: {
    enabled: boolean;
    duration: number;
  };
  offlineMode: {
    enabled: boolean;
    syncOnReconnect: boolean;
  };
}

export interface PrivacyPreferences {
  dataSharing: {
    analytics: boolean;
    crashReports: boolean;
    usageStats: boolean;
  };
  security: {
    biometricAuth: boolean;
    sessionTimeout: number;
    requirePin: boolean;
  };
  export: {
    format: 'csv' | 'pdf' | 'excel';
    includeMetadata: boolean;
    encryption: boolean;
  };
}

export interface AppPreferences {
  general: GeneralPreferences;
  modules: ModulePreferences;
  data: DataPreferences;
  performance: PerformancePreferences;
  privacy: PrivacyPreferences;
  lastUpdated: Date;
  version: string;
}

export class PreferencesService {
  private static instance: PreferencesService;
  private eventEmitter: EventEmitter;
  private authService: AuthService;
  private perfService: PerformanceService;
  private preferences: AppPreferences;
  private readonly PREFERENCES_KEY = 'app_preferences';
  private readonly SYNC_KEY = 'preferences_sync';

  private constructor() {
    this.eventEmitter = new EventEmitter();
    this.authService = AuthService.getInstance();
    this.perfService = PerformanceService.getInstance();
    this.preferences = this.getDefaultPreferences();
    this.initialize();
  }

  static getInstance(): PreferencesService {
    if (!PreferencesService.instance) {
      PreferencesService.instance = new PreferencesService();
    }
    return PreferencesService.instance;
  }

  private getDefaultPreferences(): AppPreferences {
    return {
      general: {
        theme: 'system',
        language: 'en',
        notifications: {
          enabled: true,
          sound: true,
          vibration: true,
          email: false,
        },
        accessibility: {
          fontSize: 1,
          highContrast: false,
          reducedMotion: false,
        },
      },
      modules: {
        cattle: {
          defaultView: 'list',
          sortBy: 'name',
          showInactive: false,
          customFields: [],
        },
        health: {
          alertThresholds: {
            weight: 10,
            temperature: 2,
            heartRate: 20,
          },
          defaultVet: '',
          autoSchedule: true,
        },
        financial: {
          currency: 'USD',
          fiscalYearStart: '01-01',
          defaultTaxRate: 0,
          showProjections: true,
        },
      },
      data: {
        backup: {
          frequency: 'daily',
          includeMedia: true,
          compression: true,
          retention: 30,
        },
        sync: {
          frequency: 'hourly',
          onCellular: false,
          onBattery: true,
          conflictResolution: 'newest',
        },
        storage: {
          maxCacheSize: 1024,
          autoCleanup: true,
          mediaQuality: 'medium',
        },
      },
      performance: {
        dataRefresh: {
          frequency: 15,
          backgroundSync: true,
          prefetch: true,
        },
        animations: {
          enabled: true,
          duration: 300,
        },
        offlineMode: {
          enabled: true,
          syncOnReconnect: true,
        },
      },
      privacy: {
        dataSharing: {
          analytics: true,
          crashReports: true,
          usageStats: true,
        },
        security: {
          biometricAuth: false,
          sessionTimeout: 30,
          requirePin: false,
        },
        export: {
          format: 'csv',
          includeMetadata: true,
          encryption: true,
        },
      },
      lastUpdated: new Date(),
      version: '1.0.0',
    };
  }

  private async initialize() {
    try {
      // Load saved preferences
      const savedPreferences = await this.loadPreferences();
      if (savedPreferences) {
        this.preferences = { ...this.preferences, ...savedPreferences };
      }

      // Apply preferences
      await this.applyPreferences();

      // Start sync if enabled
      if (this.preferences.data.sync.frequency !== 'manual') {
        this.startSync();
      }
    } catch (error) {
      console.error('Error initializing preferences service:', error);
    }
  }

  async getPreferences(): Promise<AppPreferences> {
    return { ...this.preferences };
  }

  async updatePreferences(
    updates: Partial<AppPreferences>
  ): Promise<void> {
    try {
      this.preferences = {
        ...this.preferences,
        ...updates,
        lastUpdated: new Date(),
      };

      await this.savePreferences();
      await this.applyPreferences();
      this.eventEmitter.emit('preferencesUpdated', this.preferences);

      // Sync if enabled
      if (this.preferences.data.sync.frequency !== 'manual') {
        await this.syncPreferences();
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  async resetPreferences(): Promise<void> {
    try {
      this.preferences = this.getDefaultPreferences();
      await this.savePreferences();
      await this.applyPreferences();
      this.eventEmitter.emit('preferencesReset');
    } catch (error) {
      console.error('Error resetting preferences:', error);
      throw error;
    }
  }

  private async applyPreferences(): Promise<void> {
    try {
      // Apply theme
      // TODO: Implement theme application

      // Apply language
      // TODO: Implement language application

      // Apply performance settings
      this.perfService.setRefreshInterval(
        this.preferences.performance.dataRefresh.frequency
      );

      // Apply other settings as needed
    } catch (error) {
      console.error('Error applying preferences:', error);
    }
  }

  private async savePreferences(): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        this.PREFERENCES_KEY,
        JSON.stringify(this.preferences)
      );
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw error;
    }
  }

  private async loadPreferences(): Promise<AppPreferences | null> {
    try {
      const preferencesJson = await SecureStore.getItemAsync(this.PREFERENCES_KEY);
      return preferencesJson ? JSON.parse(preferencesJson) : null;
    } catch (error) {
      console.error('Error loading preferences:', error);
      return null;
    }
  }

  private async syncPreferences(): Promise<void> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user) return;

      // TODO: Implement cloud sync
      // This would typically involve:
      // 1. Fetching remote preferences
      // 2. Resolving conflicts based on preferences.data.sync.conflictResolution
      // 3. Updating local preferences
      // 4. Pushing changes to cloud
    } catch (error) {
      console.error('Error syncing preferences:', error);
    }
  }

  private startSync(): void {
    // TODO: Implement periodic sync based on preferences.data.sync.frequency
  }

  // Event Handling
  onPreferencesUpdated(
    callback: (preferences: AppPreferences) => void
  ): () => void {
    this.eventEmitter.on('preferencesUpdated', callback);
    return () => {
      this.eventEmitter.off('preferencesUpdated', callback);
    };
  }

  onPreferencesReset(callback: () => void): () => void {
    this.eventEmitter.on('preferencesReset', callback);
    return () => {
      this.eventEmitter.off('preferencesReset', callback);
    };
  }
} 