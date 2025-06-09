import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { EventEmitter } from 'events';
import { PerformanceService } from './performanceService';
import { AuthService } from './AuthService';

export interface BackupConfig {
  schedule: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string; // HH:mm format
    days?: number[]; // For weekly/monthly backups
  };
  retention: {
    maxBackups: number;
    keepForDays: number;
  };
  encryption: {
    enabled: boolean;
    algorithm: 'aes-256-gcm';
  };
  cloudStorage: {
    enabled: boolean;
    provider: 'google' | 'dropbox' | 'aws';
    credentials?: Record<string, string>;
  };
  dataTypes: {
    financial: boolean;
    inventory: boolean;
    users: boolean;
    settings: boolean;
    analytics: boolean;
  };
}

export interface BackupMetadata {
  id: string;
  timestamp: Date;
  size: number;
  dataTypes: string[];
  encryption: {
    enabled: boolean;
    algorithm?: string;
  };
  checksum: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error?: string;
}

export interface RestoreOptions {
  backupId: string;
  dataTypes: string[];
  conflictResolution: 'skip' | 'overwrite' | 'merge';
  validateAfterRestore: boolean;
}

export class BackupService {
  private static instance: BackupService;
  private eventEmitter: EventEmitter;
  private perfService: PerformanceService;
  private authService: AuthService;
  private config: BackupConfig;
  private readonly BACKUP_DIR = `${FileSystem.documentDirectory}backups/`;
  private readonly CONFIG_KEY = 'backup_config';
  private readonly METADATA_KEY = 'backup_metadata';

  private constructor() {
    this.eventEmitter = new EventEmitter();
    this.perfService = PerformanceService.getInstance();
    this.authService = AuthService.getInstance();
    this.config = this.getDefaultConfig();
    this.initialize();
  }

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  private getDefaultConfig(): BackupConfig {
    return {
      schedule: {
        enabled: true,
        frequency: 'daily',
        time: '02:00',
      },
      retention: {
        maxBackups: 30,
        keepForDays: 90,
      },
      encryption: {
        enabled: true,
        algorithm: 'aes-256-gcm',
      },
      cloudStorage: {
        enabled: false,
        provider: 'google',
      },
      dataTypes: {
        financial: true,
        inventory: true,
        users: true,
        settings: true,
        analytics: true,
      },
    };
  }

  private async initialize() {
    try {
      // Create backup directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(this.BACKUP_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.BACKUP_DIR, { intermediates: true });
      }

      // Load saved config
      const savedConfig = await this.loadConfig();
      if (savedConfig) {
        this.config = { ...this.config, ...savedConfig };
      }

      // Start backup scheduler
      if (this.config.schedule.enabled) {
        this.startScheduler();
      }
    } catch (error) {
      console.error('Error initializing backup service:', error);
    }
  }

  // Configuration Management
  async updateConfig(newConfig: Partial<BackupConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...newConfig };
      await this.saveConfig();
      
      if (this.config.schedule.enabled) {
        this.startScheduler();
      } else {
        this.stopScheduler();
      }
    } catch (error) {
      console.error('Error updating backup config:', error);
      throw error;
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        this.CONFIG_KEY,
        JSON.stringify(this.config)
      );
    } catch (error) {
      console.error('Error saving backup config:', error);
      throw error;
    }
  }

  private async loadConfig(): Promise<BackupConfig | null> {
    try {
      const configJson = await SecureStore.getItemAsync(this.CONFIG_KEY);
      return configJson ? JSON.parse(configJson) : null;
    } catch (error) {
      console.error('Error loading backup config:', error);
      return null;
    }
  }

  // Backup Operations
  async createBackup(): Promise<BackupMetadata> {
    return this.perfService.measureAsync('backup_creation', async () => {
      const metadata: BackupMetadata = {
        id: this.generateBackupId(),
        timestamp: new Date(),
        size: 0,
        dataTypes: [],
        encryption: {
          enabled: this.config.encryption.enabled,
          algorithm: this.config.encryption.algorithm,
        },
        checksum: '',
        status: 'in_progress',
      };

      try {
        // Emit backup started event
        this.eventEmitter.emit('backupStarted', metadata);

        // Collect data based on selected types
        const backupData = await this.collectBackupData();
        metadata.dataTypes = Object.keys(backupData);

        // Encrypt data if enabled
        const processedData = this.config.encryption.enabled
          ? await this.encryptData(backupData)
          : backupData;

        // Calculate checksum
        metadata.checksum = await this.calculateChecksum(processedData);

        // Save backup
        const backupPath = `${this.BACKUP_DIR}${metadata.id}.backup`;
        await FileSystem.writeAsStringAsync(
          backupPath,
          JSON.stringify(processedData)
        );

        // Get backup size
        const fileInfo = await FileSystem.getInfoAsync(backupPath);
        metadata.size = fileInfo.exists ? (fileInfo as any).size || 0 : 0;

        // Upload to cloud if enabled
        if (this.config.cloudStorage.enabled) {
          await this.uploadToCloud(backupPath, metadata);
        }

        metadata.status = 'completed';
        this.eventEmitter.emit('backupCompleted', metadata);

        // Apply retention policy
        await this.applyRetentionPolicy();

        return metadata;
      } catch (error) {
        console.error('Error creating backup:', error);
        const errorMetadata = {
          ...metadata,
          status: 'failed' as const,
          error: error.message,
        };
        this.eventEmitter.emit('backupFailed', errorMetadata);
        throw error;
      }
    });
  }

  // Restore Operations
  async restoreBackup(options: RestoreOptions): Promise<void> {
    return this.perfService.measureAsync('backup_restore', async () => {
      try {
        // Load backup
        const backupPath = `${this.BACKUP_DIR}${options.backupId}.backup`;
        const backupData = await this.loadBackup(backupPath);

        // Verify checksum
        const checksum = await this.calculateChecksum(backupData);
        if (checksum !== backupData.checksum) {
          throw new Error('Backup integrity check failed');
        }

        // Decrypt if necessary
        const decryptedData = this.config.encryption.enabled
          ? await this.decryptData(backupData)
          : backupData;

        // Restore selected data types
        await this.restoreData(decryptedData, options);

        // Validate restore if requested
        if (options.validateAfterRestore) {
          await this.validateRestore(options.dataTypes);
        }
      } catch (error) {
        console.error('Error restoring backup:', error);
        throw error;
      }
    });
  }

  // Event Handling
  onBackupStarted(callback: (metadata: BackupMetadata) => void): () => void {
    this.eventEmitter.on('backupStarted', callback);
    return () => {
      this.eventEmitter.off('backupStarted', callback);
    };
  }

  onBackupCompleted(callback: (metadata: BackupMetadata) => void): () => void {
    this.eventEmitter.on('backupCompleted', callback);
    return () => {
      this.eventEmitter.off('backupCompleted', callback);
    };
  }

  onBackupFailed(callback: (metadata: BackupMetadata) => void): () => void {
    this.eventEmitter.on('backupFailed', callback);
    return () => {
      this.eventEmitter.off('backupFailed', callback);
    };
  }

  // Helper Methods
  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async collectBackupData(): Promise<Record<string, any>> {
    const data: Record<string, any> = {};

    if (this.config.dataTypes.financial) {
      // Implement financial data collection
    }

    if (this.config.dataTypes.inventory) {
      // Implement inventory data collection
    }

    if (this.config.dataTypes.users) {
      // Implement user data collection
    }

    if (this.config.dataTypes.settings) {
      // Implement settings data collection
    }

    if (this.config.dataTypes.analytics) {
      // Implement analytics data collection
    }

    return data;
  }

  private async encryptData(data: any): Promise<string> {
    // Implement encryption
    return JSON.stringify(data);
  }

  private async decryptData(data: string): Promise<any> {
    // Implement decryption
    return JSON.parse(data);
  }

  private async calculateChecksum(data: any): Promise<string> {
    // Implement checksum calculation
    return '';
  }

  private async uploadToCloud(
    backupPath: string,
    metadata: BackupMetadata
  ): Promise<void> {
    // Implement cloud upload
  }

  private async applyRetentionPolicy(): Promise<void> {
    try {
      const backups = await this.listBackups();
      const now = new Date();

      // Remove old backups
      for (const backup of backups) {
        const age = now.getTime() - backup.timestamp.getTime();
        const ageInDays = age / (1000 * 60 * 60 * 24);

        if (
          ageInDays > this.config.retention.keepForDays ||
          backups.length > this.config.retention.maxBackups
        ) {
          await this.deleteBackup(backup.id);
        }
      }
    } catch (error) {
      console.error('Error applying retention policy:', error);
    }
  }

  private async listBackups(): Promise<BackupMetadata[]> {
    try {
      const backupsJson = await SecureStore.getItemAsync(this.METADATA_KEY);
      return backupsJson ? JSON.parse(backupsJson) : [];
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }

  public async deleteBackup(backupId: string): Promise<void> {
    try {
      const backupPath = `${this.BACKUP_DIR}${backupId}.backup`;
      await FileSystem.deleteAsync(backupPath);

      const backups = await this.listBackups();
      const updatedBackups = backups.filter((b) => b.id !== backupId);
      await SecureStore.setItemAsync(
        this.METADATA_KEY,
        JSON.stringify(updatedBackups)
      );
    } catch (error) {
      console.error('Error deleting backup:', error);
      throw error;
    }
  }

  private startScheduler(): void {
    // Implement backup scheduler
  }

  private stopScheduler(): void {
    // Implement scheduler cleanup
  }

  private async validateRestore(dataTypes: string[]): Promise<void> {
    // Implement restore validation
  }

  private async loadBackup(backupPath: string): Promise<any> {
    try {
      const backupData = await FileSystem.readAsStringAsync(backupPath);
      return JSON.parse(backupData);
    } catch (error) {
      console.error('Error loading backup:', error);
      throw error;
    }
  }

  private async restoreData(data: any, options: RestoreOptions): Promise<void> {
    try {
      // Implement data restoration based on selected types and conflict resolution
      for (const dataType of options.dataTypes) {
        if (data[dataType]) {
          // Restore each data type according to conflict resolution strategy
          switch (options.conflictResolution) {
            case 'skip':
              // Skip if data exists
              break;
            case 'overwrite':
              // Overwrite existing data
              break;
            case 'merge':
              // Merge with existing data
              break;
          }
        }
      }
    } catch (error) {
      console.error('Error restoring data:', error);
      throw error;
    }
  }
} 