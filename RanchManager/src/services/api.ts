import {
  Transaction,
  Budget,
  Report,
  ReportType,
  ReportParameters,
  TransactionFilters,
  BudgetFilters,
  IncomeStatementData,
  ExpenseBreakdownData,
  BudgetPerformanceData,
  EntityProfitabilityData
} from '../store/types/financial';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://api.ranchmanager.com';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      await AsyncStorage.removeItem('auth_token');
      // You might want to dispatch a logout action here
    }
    return Promise.reject(error);
  }
);

// Mock data generators
const generateId = () => Math.random().toString(36).substr(2, 9);
const generateDate = () => new Date().toISOString();

// Mock data
const mockTransactions: Transaction[] = [];
const mockBudgets: Budget[] = [];
const mockReports: Report[] = [];

// Mock API implementation
export const mockApi = {
  // Transaction endpoints
  getTransactions: async (filters?: TransactionFilters) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return { data: mockTransactions };
  },

  createTransaction: async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current_user',
      updatedBy: 'current_user'
    };
    mockTransactions.push(newTransaction);
    return { data: newTransaction };
  },

  updateTransaction: async (transaction: Transaction) => {
    const index = mockTransactions.findIndex(t => t.id === transaction.id);
    if (index === -1) throw new Error('Transaction not found');
    mockTransactions[index] = {
      ...transaction,
      updatedAt: new Date(),
      updatedBy: 'current_user'
    };
    return { data: mockTransactions[index] };
  },

  deleteTransaction: async (id: string) => {
    const index = mockTransactions.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Transaction not found');
    mockTransactions.splice(index, 1);
    return { data: { success: true } };
  },

  // Budget endpoints
  getBudgets: async (filters?: BudgetFilters) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { data: mockBudgets };
  },

  createBudget: async (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newBudget: Budget = {
      ...budget,
      id: generateId(),
      createdAt: generateDate(),
      updatedAt: generateDate()
    };
    mockBudgets.push(newBudget);
    return { data: newBudget };
  },

  updateBudget: async (budget: Budget) => {
    const index = mockBudgets.findIndex(b => b.id === budget.id);
    if (index === -1) throw new Error('Budget not found');
    mockBudgets[index] = {
      ...budget,
      updatedAt: generateDate()
    };
    return { data: mockBudgets[index] };
  },

  deleteBudget: async (id: string) => {
    const index = mockBudgets.findIndex(b => b.id === id);
    if (index === -1) throw new Error('Budget not found');
    mockBudgets.splice(index, 1);
    return { data: { success: true } };
  },

  // Report endpoints
  generateReport: async (type: ReportType, parameters: ReportParameters) => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    let results: any;
    switch (type) {
      case 'income':
        results = {
          summary: {
            totalIncome: 50000,
            totalExpenses: 30000,
            netProfit: 20000,
            categoryTotals: {},
            periodStart: parameters.startDate,
            periodEnd: parameters.endDate
          },
          details: {
            periods: ['Jan', 'Feb', 'Mar'],
            income: [15000, 18000, 17000],
            expenses: [9000, 11000, 10000]
          }
        };
        break;
      case 'expense':
        results = {
          summary: {
            totalIncome: 0,
            totalExpenses: 30000,
            netProfit: -30000,
            categoryTotals: {},
            periodStart: parameters.startDate,
            periodEnd: parameters.endDate
          },
          details: {
            categories: [
              { name: 'Feed', amount: 12000, color: '#FF5733' },
              { name: 'Veterinary', amount: 8000, color: '#33FF57' },
              { name: 'Equipment', amount: 10000, color: '#3357FF' }
            ]
          }
        };
        break;
      case 'budget':
        results = {
          summary: {
            totalIncome: 0,
            totalExpenses: 30000,
            netProfit: -30000,
            categoryTotals: {},
            periodStart: parameters.startDate,
            periodEnd: parameters.endDate
          },
          details: {
            periods: ['Jan', 'Feb', 'Mar'],
            budgeted: [10000, 10000, 10000],
            actual: [9000, 11000, 10000]
          }
        };
        break;
      case 'entity':
        results = {
          summary: {
            totalIncome: 50000,
            totalExpenses: 30000,
            netProfit: 20000,
            categoryTotals: {},
            periodStart: parameters.startDate,
            periodEnd: parameters.endDate
          },
          details: {
            entities: [
              {
                name: 'Cattle A',
                revenue: 20000,
                costs: 12000,
                profit: 8000,
                roi: 66.67
              },
              {
                name: 'Cattle B',
                revenue: 30000,
                costs: 18000,
                profit: 12000,
                roi: 66.67
              }
            ]
          }
        };
        break;
    }

    const report: Report = {
      id: generateId(),
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
      type,
      parameters,
      dateGenerated: new Date(),
      results,
      createdAt: new Date(),
      createdBy: 'current_user'
    };

    mockReports.push(report);
    return { data: report };
  },

  exportReport: async (reportId: string, format: 'pdf' | 'csv') => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const report = mockReports.find(r => r.id === reportId);
    if (!report) throw new Error('Report not found');

    // Simulate file generation
    const fileName = `${report.name.toLowerCase().replace(/\s+/g, '_')}_${format}`;
    return {
      data: {
        url: `https://example.com/reports/${fileName}`,
        format,
        size: '1.2MB'
      }
    };
  }
}; 