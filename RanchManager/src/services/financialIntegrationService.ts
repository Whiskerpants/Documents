import { Platform } from 'react-native';
import axios, { AxiosInstance } from 'axios';
import { Transaction, TransactionType, TransactionCategory } from '../store/types/financial';
import { CattleFinancialSummary } from '../store/types/cattle';
import * as SecureStore from 'expo-secure-store';

// Types for external service configurations
interface ServiceConfig {
  baseUrl: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  scopes?: string[];
}

interface IntegrationCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string[];
}

interface MarketPrice {
  commodity: string;
  price: number;
  unit: string;
  timestamp: Date;
  source: string;
}

interface TaxEstimate {
  income: number;
  expenses: number;
  deductions: number;
  taxableIncome: number;
  estimatedTax: number;
  breakdown: {
    federal: number;
    state: number;
    local: number;
  };
}

interface PaymentDetails {
  amount: number;
  currency: string;
  description: string;
  metadata?: Record<string, any>;
}

export class FinancialIntegrationService {
  private static instance: FinancialIntegrationService;
  private readonly CREDENTIALS_KEY = 'financial_integration_credentials';
  private readonly CONFIG_KEY = 'financial_integration_config';

  private quickbooksClient: AxiosInstance;
  private xeroClient: AxiosInstance;
  private bankClient: AxiosInstance;
  private marketClient: AxiosInstance;
  private taxClient: AxiosInstance;
  private paymentClient: AxiosInstance;

  private constructor() {
    this.initializeClients();
  }

  static getInstance(): FinancialIntegrationService {
    if (!FinancialIntegrationService.instance) {
      FinancialIntegrationService.instance = new FinancialIntegrationService();
    }
    return FinancialIntegrationService.instance;
  }

  private async initializeClients() {
    const config = await this.loadConfig();
    
    // Initialize API clients with proper configuration
    this.quickbooksClient = this.createAxiosClient(config.quickbooks);
    this.xeroClient = this.createAxiosClient(config.xero);
    this.bankClient = this.createAxiosClient(config.bank);
    this.marketClient = this.createAxiosClient(config.market);
    this.taxClient = this.createAxiosClient(config.tax);
    this.paymentClient = this.createAxiosClient(config.payment);
  }

  private createAxiosClient(config: ServiceConfig): AxiosInstance {
    return axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  // QuickBooks Integration
  async syncWithQuickBooks(transactions: Transaction[]): Promise<boolean> {
    try {
      const credentials = await this.getCredentials('quickbooks');
      if (!credentials) {
        throw new Error('QuickBooks credentials not found');
      }

      // Transform transactions to QuickBooks format
      const quickbooksTransactions = transactions.map(t => ({
        TxnDate: t.date,
        Amount: t.amount,
        AccountRef: this.mapToQuickBooksAccount(t.category),
        Description: t.description,
        PrivateNote: `RanchManager ID: ${t.id}`,
      }));

      // Sync transactions in batches
      const batchSize = 100;
      for (let i = 0; i < quickbooksTransactions.length; i += batchSize) {
        const batch = quickbooksTransactions.slice(i, i + batchSize);
        await this.quickbooksClient.post('/v3/company/transactions', {
          BatchItemRequest: batch.map(t => ({
            bId: `batch_${i}`,
            Transaction: t,
          })),
        });
      }

      return true;
    } catch (error) {
      console.error('Error syncing with QuickBooks:', error);
      return false;
    }
  }

  // Xero Integration
  async syncWithXero(transactions: Transaction[]): Promise<boolean> {
    try {
      const credentials = await this.getCredentials('xero');
      if (!credentials) {
        throw new Error('Xero credentials not found');
      }

      // Transform transactions to Xero format
      const xeroTransactions = transactions.map(t => ({
        date: t.date,
        amount: t.amount,
        accountCode: this.mapToXeroAccount(t.category),
        description: t.description,
        reference: t.id,
      }));

      // Sync transactions in batches
      const batchSize = 100;
      for (let i = 0; i < xeroTransactions.length; i += batchSize) {
        const batch = xeroTransactions.slice(i, i + batchSize);
        await this.xeroClient.post('/api.xro/2.0/BankTransactions', {
          BankTransactions: batch,
        });
      }

      return true;
    } catch (error) {
      console.error('Error syncing with Xero:', error);
      return false;
    }
  }

  // Banking API Integration
  async importBankTransactions(
    accountId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Transaction[]> {
    try {
      const credentials = await this.getCredentials('bank');
      if (!credentials) {
        throw new Error('Banking credentials not found');
      }

      const response = await this.bankClient.get('/transactions', {
        params: {
          accountId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });

      // Transform bank transactions to app format
      return response.data.transactions.map((t: any) => ({
        id: t.id,
        date: new Date(t.date),
        amount: t.amount,
        type: t.amount > 0 ? TransactionType.Income : TransactionType.Expense,
        category: this.mapBankCategory(t.category),
        description: t.description,
        relatedEntityId: t.metadata?.entityId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'bank_import',
        updatedBy: 'bank_import',
      }));
    } catch (error) {
      console.error('Error importing bank transactions:', error);
      throw error;
    }
  }

  // Market Price Integration
  async getMarketPrices(commodities: string[]): Promise<MarketPrice[]> {
    try {
      const credentials = await this.getCredentials('market');
      if (!credentials) {
        throw new Error('Market data credentials not found');
      }

      const response = await this.marketClient.get('/prices', {
        params: {
          commodities: commodities.join(','),
        },
      });

      return response.data.prices.map((p: any) => ({
        commodity: p.commodity,
        price: p.price,
        unit: p.unit,
        timestamp: new Date(p.timestamp),
        source: p.source,
      }));
    } catch (error) {
      console.error('Error fetching market prices:', error);
      throw error;
    }
  }

  // Tax Calculation
  async calculateTaxEstimate(
    income: number,
    expenses: number,
    deductions: number
  ): Promise<TaxEstimate> {
    try {
      const credentials = await this.getCredentials('tax');
      if (!credentials) {
        throw new Error('Tax service credentials not found');
      }

      const response = await this.taxClient.post('/calculate', {
        income,
        expenses,
        deductions,
        businessType: 'ranch',
        state: 'CA', // TODO: Get from settings
      });

      return {
        income,
        expenses,
        deductions,
        taxableIncome: response.data.taxableIncome,
        estimatedTax: response.data.totalTax,
        breakdown: {
          federal: response.data.federalTax,
          state: response.data.stateTax,
          local: response.data.localTax,
        },
      };
    } catch (error) {
      console.error('Error calculating tax estimate:', error);
      throw error;
    }
  }

  // Payment Processing
  async processPayment(details: PaymentDetails): Promise<{ success: boolean; transactionId?: string }> {
    try {
      const credentials = await this.getCredentials('payment');
      if (!credentials) {
        throw new Error('Payment service credentials not found');
      }

      const response = await this.paymentClient.post('/payments', {
        amount: details.amount,
        currency: details.currency,
        description: details.description,
        metadata: details.metadata,
      });

      return {
        success: true,
        transactionId: response.data.transactionId,
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      return { success: false };
    }
  }

  // Authentication and Configuration Management
  private async getCredentials(service: string): Promise<IntegrationCredentials | null> {
    try {
      const credentials = await SecureStore.getItemAsync(this.CREDENTIALS_KEY);
      if (!credentials) return null;

      const allCredentials = JSON.parse(credentials);
      return allCredentials[service] || null;
    } catch (error) {
      console.error('Error getting credentials:', error);
      return null;
    }
  }

  private async saveCredentials(
    service: string,
    credentials: IntegrationCredentials
  ): Promise<void> {
    try {
      const existingCredentials = await this.getCredentials(service);
      const allCredentials = {
        ...existingCredentials,
        [service]: credentials,
      };

      await SecureStore.setItemAsync(
        this.CREDENTIALS_KEY,
        JSON.stringify(allCredentials)
      );
    } catch (error) {
      console.error('Error saving credentials:', error);
      throw error;
    }
  }

  private async loadConfig(): Promise<Record<string, ServiceConfig>> {
    try {
      const config = await SecureStore.getItemAsync(this.CONFIG_KEY);
      if (!config) {
        throw new Error('Integration configuration not found');
      }
      return JSON.parse(config);
    } catch (error) {
      console.error('Error loading configuration:', error);
      throw error;
    }
  }

  // Helper methods for data transformation
  private mapToQuickBooksAccount(category: TransactionCategory): string {
    const accountMap: Record<TransactionCategory, string> = {
      [TransactionCategory.Feed]: 'Feed Expenses',
      [TransactionCategory.Veterinary]: 'Veterinary Expenses',
      [TransactionCategory.Equipment]: 'Equipment Expenses',
      [TransactionCategory.Labor]: 'Labor Expenses',
      [TransactionCategory.Facilities]: 'Facilities Expenses',
      [TransactionCategory.Transportation]: 'Transportation Expenses',
      [TransactionCategory.Marketing]: 'Marketing Expenses',
      [TransactionCategory.Insurance]: 'Insurance Expenses',
      [TransactionCategory.Taxes]: 'Tax Expenses',
      [TransactionCategory.Utilities]: 'Utilities Expenses',
      [TransactionCategory.OtherExpense]: 'Other Expenses',
      [TransactionCategory.CattleSales]: 'Cattle Sales Income',
      [TransactionCategory.BreedingServices]: 'Breeding Services Income',
      [TransactionCategory.MilkSales]: 'Milk Sales Income',
      [TransactionCategory.OtherIncome]: 'Other Income',
    };

    return accountMap[category] || 'Other';
  }

  private mapToXeroAccount(category: TransactionCategory): string {
    const accountMap: Record<TransactionCategory, string> = {
      [TransactionCategory.Feed]: '400',
      [TransactionCategory.Veterinary]: '410',
      [TransactionCategory.Equipment]: '420',
      [TransactionCategory.Labor]: '430',
      [TransactionCategory.Facilities]: '440',
      [TransactionCategory.Transportation]: '450',
      [TransactionCategory.Marketing]: '460',
      [TransactionCategory.Insurance]: '470',
      [TransactionCategory.Taxes]: '480',
      [TransactionCategory.Utilities]: '490',
      [TransactionCategory.OtherExpense]: '499',
      [TransactionCategory.CattleSales]: '200',
      [TransactionCategory.BreedingServices]: '210',
      [TransactionCategory.MilkSales]: '220',
      [TransactionCategory.OtherIncome]: '299',
    };

    return accountMap[category] || '999';
  }

  private mapBankCategory(bankCategory: string): TransactionCategory {
    const categoryMap: Record<string, TransactionCategory> = {
      'feed': TransactionCategory.Feed,
      'veterinary': TransactionCategory.Veterinary,
      'equipment': TransactionCategory.Equipment,
      'labor': TransactionCategory.Labor,
      'facilities': TransactionCategory.Facilities,
      'transportation': TransactionCategory.Transportation,
      'marketing': TransactionCategory.Marketing,
      'insurance': TransactionCategory.Insurance,
      'taxes': TransactionCategory.Taxes,
      'utilities': TransactionCategory.Utilities,
      'cattle_sales': TransactionCategory.CattleSales,
      'breeding_services': TransactionCategory.BreedingServices,
      'milk_sales': TransactionCategory.MilkSales,
    };

    return categoryMap[bankCategory.toLowerCase()] || TransactionCategory.OtherExpense;
  }
} 