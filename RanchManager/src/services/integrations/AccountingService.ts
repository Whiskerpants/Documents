import { EventEmitter } from 'events';
import * as SecureStore from 'expo-secure-store';

export interface Transaction {
  id: string;
  date: Date;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  reference?: string;
  status: 'pending' | 'completed' | 'failed';
  metadata?: Record<string, any>;
}

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  balance: number;
  currency: string;
  lastSync: Date;
}

export interface AccountingPreferences {
  apiKey: string;
  provider: 'quickbooks' | 'xero' | 'sage' | 'custom';
  syncInterval: number; // minutes
  accounts: string[];
  categories: {
    income: string[];
    expense: string[];
  };
  automation: {
    enabled: boolean;
    rules: {
      type: 'income' | 'expense';
      category: string;
      amount: number;
      action: 'notify' | 'categorize' | 'approve';
    }[];
  };
  reporting: {
    frequency: 'daily' | 'weekly' | 'monthly';
    format: 'pdf' | 'excel' | 'csv';
    recipients: string[];
  };
}

export class AccountingService {
  private static instance: AccountingService;
  private eventEmitter: EventEmitter;
  private preferences: AccountingPreferences;
  private readonly PREFERENCES_KEY = 'accounting_preferences';
  private syncInterval?: NodeJS.Timeout;

  private constructor() {
    this.eventEmitter = new EventEmitter();
    this.preferences = this.getDefaultPreferences();
    this.initialize();
  }

  static getInstance(): AccountingService {
    if (!AccountingService.instance) {
      AccountingService.instance = new AccountingService();
    }
    return AccountingService.instance;
  }

  private getDefaultPreferences(): AccountingPreferences {
    return {
      apiKey: '',
      provider: 'quickbooks',
      syncInterval: 60,
      accounts: [],
      categories: {
        income: ['sales', 'services', 'investments'],
        expense: ['feed', 'veterinary', 'equipment', 'utilities'],
      },
      automation: {
        enabled: false,
        rules: [],
      },
      reporting: {
        frequency: 'monthly',
        format: 'pdf',
        recipients: [],
      },
    };
  }

  private async initialize() {
    try {
      const savedPreferences = await this.loadPreferences();
      if (savedPreferences) {
        this.preferences = { ...this.preferences, ...savedPreferences };
      }
      this.startSync();
    } catch (error) {
      console.error('Error initializing accounting service:', error);
    }
  }

  async getPreferences(): Promise<AccountingPreferences> {
    return { ...this.preferences };
  }

  async updatePreferences(updates: Partial<AccountingPreferences>): Promise<void> {
    try {
      this.preferences = { ...this.preferences, ...updates };
      await this.savePreferences();
      this.restartSync();
    } catch (error) {
      console.error('Error updating accounting preferences:', error);
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
      console.error('Error saving accounting preferences:', error);
      throw error;
    }
  }

  private async loadPreferences(): Promise<AccountingPreferences | null> {
    try {
      const preferencesJson = await SecureStore.getItemAsync(this.PREFERENCES_KEY);
      return preferencesJson ? JSON.parse(preferencesJson) : null;
    } catch (error) {
      console.error('Error loading accounting preferences:', error);
      return null;
    }
  }

  private startSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(
      () => this.syncTransactions(),
      this.preferences.syncInterval * 60 * 1000
    );
  }

  private restartSync() {
    this.startSync();
  }

  private async syncTransactions() {
    try {
      // TODO: Implement actual API calls to accounting provider
      // This would typically involve:
      // 1. Fetching new transactions
      // 2. Applying automation rules
      // 3. Updating local records
      // 4. Generating reports if needed

      this.eventEmitter.emit('transactionsSynced', {
        // sync results
      });
    } catch (error) {
      console.error('Error syncing transactions:', error);
    }
  }

  async getAccounts(): Promise<Account[]> {
    // TODO: Implement actual API call
    throw new Error('Not implemented');
  }

  async getTransactions(
    startDate: Date,
    endDate: Date,
    filters?: {
      type?: Transaction['type'];
      category?: string;
      status?: Transaction['status'];
    }
  ): Promise<Transaction[]> {
    // TODO: Implement actual API call
    throw new Error('Not implemented');
  }

  async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    // TODO: Implement actual API call
    throw new Error('Not implemented');
  }

  async updateTransaction(
    id: string,
    updates: Partial<Transaction>
  ): Promise<Transaction> {
    // TODO: Implement actual API call
    throw new Error('Not implemented');
  }

  async generateReport(
    type: 'income' | 'expense' | 'profit' | 'tax',
    startDate: Date,
    endDate: Date
  ): Promise<string> {
    // TODO: Implement actual API call
    throw new Error('Not implemented');
  }

  // Event Handling
  onTransactionsSynced(callback: (data: any) => void): () => void {
    this.eventEmitter.on('transactionsSynced', callback);
    return () => {
      this.eventEmitter.off('transactionsSynced', callback);
    };
  }

  onTransactionAdded(callback: (transaction: Transaction) => void): () => void {
    this.eventEmitter.on('transactionAdded', callback);
    return () => {
      this.eventEmitter.off('transactionAdded', callback);
    };
  }

  onReportGenerated(callback: (report: string) => void): () => void {
    this.eventEmitter.on('reportGenerated', callback);
    return () => {
      this.eventEmitter.off('reportGenerated', callback);
    };
  }
} 