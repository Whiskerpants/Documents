import { EventEmitter } from 'events';
import * as SecureStore from 'expo-secure-store';

export interface VetRecord {
  id: string;
  animalId: string;
  date: Date;
  type: 'checkup' | 'treatment' | 'vaccination' | 'surgery';
  diagnosis?: string;
  treatment?: string;
  medications?: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  notes?: string;
  vetId: string;
  followUpDate?: Date;
  cost: number;
}

export interface VetProfile {
  id: string;
  name: string;
  clinic: string;
  phone: string;
  email: string;
  specialties: string[];
  availability: {
    days: string[];
    hours: {
      start: string;
      end: string;
    };
  };
  emergencyContact: boolean;
}

export interface VetPreferences {
  apiKey: string;
  defaultVetId?: string;
  emergencyVetId?: string;
  autoSchedule: boolean;
  notifications: {
    enabled: boolean;
    reminders: boolean;
    followUps: boolean;
    emergency: boolean;
  };
  recordSharing: {
    enabled: boolean;
    consentRequired: boolean;
    expirationDays: number;
  };
}

export class VeterinaryService {
  private static instance: VeterinaryService;
  private eventEmitter: EventEmitter;
  private preferences: VetPreferences;
  private readonly PREFERENCES_KEY = 'vet_preferences';

  private constructor() {
    this.eventEmitter = new EventEmitter();
    this.preferences = this.getDefaultPreferences();
    this.initialize();
  }

  static getInstance(): VeterinaryService {
    if (!VeterinaryService.instance) {
      VeterinaryService.instance = new VeterinaryService();
    }
    return VeterinaryService.instance;
  }

  private getDefaultPreferences(): VetPreferences {
    return {
      apiKey: '',
      autoSchedule: true,
      notifications: {
        enabled: true,
        reminders: true,
        followUps: true,
        emergency: true,
      },
      recordSharing: {
        enabled: false,
        consentRequired: true,
        expirationDays: 30,
      },
    };
  }

  private async initialize() {
    try {
      const savedPreferences = await this.loadPreferences();
      if (savedPreferences) {
        this.preferences = { ...this.preferences, ...savedPreferences };
      }
    } catch (error) {
      console.error('Error initializing veterinary service:', error);
    }
  }

  async getPreferences(): Promise<VetPreferences> {
    return { ...this.preferences };
  }

  async updatePreferences(updates: Partial<VetPreferences>): Promise<void> {
    try {
      this.preferences = { ...this.preferences, ...updates };
      await this.savePreferences();
    } catch (error) {
      console.error('Error updating veterinary preferences:', error);
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
      console.error('Error saving veterinary preferences:', error);
      throw error;
    }
  }

  private async loadPreferences(): Promise<VetPreferences | null> {
    try {
      const preferencesJson = await SecureStore.getItemAsync(this.PREFERENCES_KEY);
      return preferencesJson ? JSON.parse(preferencesJson) : null;
    } catch (error) {
      console.error('Error loading veterinary preferences:', error);
      return null;
    }
  }

  async getVetRecords(animalId?: string): Promise<VetRecord[]> {
    // TODO: Implement actual API call
    throw new Error('Not implemented');
  }

  async addVetRecord(record: Omit<VetRecord, 'id'>): Promise<VetRecord> {
    // TODO: Implement actual API call
    throw new Error('Not implemented');
  }

  async updateVetRecord(id: string, updates: Partial<VetRecord>): Promise<VetRecord> {
    // TODO: Implement actual API call
    throw new Error('Not implemented');
  }

  async getVetProfiles(): Promise<VetProfile[]> {
    // TODO: Implement actual API call
    throw new Error('Not implemented');
  }

  async scheduleAppointment(
    animalId: string,
    vetId: string,
    date: Date,
    type: VetRecord['type']
  ): Promise<VetRecord> {
    // TODO: Implement actual API call
    throw new Error('Not implemented');
  }

  async shareRecords(
    vetId: string,
    animalIds: string[],
    expirationDate?: Date
  ): Promise<void> {
    // TODO: Implement actual API call
    throw new Error('Not implemented');
  }

  // Event Handling
  onRecordUpdated(callback: (record: VetRecord) => void): () => void {
    this.eventEmitter.on('recordUpdated', callback);
    return () => {
      this.eventEmitter.off('recordUpdated', callback);
    };
  }

  onAppointmentScheduled(callback: (record: VetRecord) => void): () => void {
    this.eventEmitter.on('appointmentScheduled', callback);
    return () => {
      this.eventEmitter.off('appointmentScheduled', callback);
    };
  }

  onEmergencyAlert(callback: (message: string) => void): () => void {
    this.eventEmitter.on('emergencyAlert', callback);
    return () => {
      this.eventEmitter.off('emergencyAlert', callback);
    };
  }
} 