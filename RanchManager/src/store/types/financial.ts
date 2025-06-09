export enum TransactionType {
  Income = 'income',
  Expense = 'expense',
}

export enum TransactionCategory {
  // Income Categories
  CattleSales = 'cattle_sales',
  BreedingServices = 'breeding_services',
  MilkSales = 'milk_sales',
  OtherIncome = 'other_income',

  // Expense Categories
  Feed = 'feed',
  Veterinary = 'veterinary',
  Equipment = 'equipment',
  Labor = 'labor',
  Facilities = 'facilities',
  Transportation = 'transportation',
  Marketing = 'marketing',
  Insurance = 'insurance',
  Taxes = 'taxes',
  Utilities = 'utilities',
  OtherExpense = 'other_expense',
}

export interface Transaction {
  id: string;
  date: Date;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  relatedEntityId?: string; // ID of related cattle, pasture, etc.
  attachments?: string[]; // URLs to stored attachments
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export type BudgetPeriodType = 'monthly' | 'quarterly' | 'yearly';

export interface Budget {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  periodType: BudgetPeriodType;
  isActive: boolean;
  total: number;
  spent: number;
  categoryAllocations: Record<string, number>;
  categorySpent: Record<string, number>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  name: string;
  type: ReportType;
  parameters: ReportParameters;
  dateGenerated: Date;
  results: ReportResults;
  createdAt: Date;
  createdBy: string;
}

export type ReportType = 'income' | 'expense' | 'budget' | 'entity';

export interface ReportParameters {
  startDate: string;
  endDate: string;
  categories: string[];
  entities: string[];
}

export interface ReportResults {
  summary: FinancialSummary;
  details: Record<string, any>;
  charts?: ChartData[];
  attachments?: string[];
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  categoryTotals: Record<TransactionCategory, number>;
  entityTotals?: Record<string, number>;
  periodStart: Date;
  periodEnd: Date;
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie';
  title: string;
  data: any;
  options?: Record<string, any>;
}

export interface FinancialState {
  transactions: {
    items: Transaction[];
    selected: string | null;
    filters: TransactionFilters;
    loading: boolean;
    error: string | null;
  };
  budgets: {
    items: Budget[];
    selected: string | null;
    loading: boolean;
    error: string | null;
    filter: {
      type: 'all' | 'active' | 'inactive';
      searchQuery: string;
    };
  };
  reports: {
    items: Report[];
    selected: string | null;
    loading: boolean;
    error: string | null;
  };
  summary: {
    current: FinancialSummary | null;
    loading: boolean;
    error: string | null;
  };
  settings: FinancialSettings;
}

export interface TransactionFilters {
  startDate?: Date;
  endDate?: Date;
  type?: TransactionType;
  categories?: TransactionCategory[];
  relatedEntityId?: string;
  tags?: string[];
  search?: string;
  sortBy?: 'date' | 'amount' | 'category';
  sortOrder?: 'asc' | 'desc';
}

export interface BudgetFilters {
  period?: 'monthly' | 'quarterly' | 'annual';
  status?: 'active' | 'upcoming' | 'expired';
  search?: string;
}

export interface ReportFilters {
  type?: ReportType;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface IncomeStatementData {
  periods: string[];
  income: number[];
  expenses: number[];
}

export interface ExpenseBreakdownData {
  categories: Array<{
    name: string;
    amount: number;
    color: string;
  }>;
  trends?: Array<{
    category: string;
    change: number;
    period: string;
  }>;
}

export interface BudgetPerformanceData {
  periods: string[];
  budgeted: number[];
  actual: number[];
}

export interface EntityProfitabilityData {
  entities: Array<{
    name: string;
    revenue: number;
    costs: number;
    profit: number;
    roi: number;
  }>;
}

export interface ReportsState {
  reports: {
    income: IncomeStatementData | null;
    expense: ExpenseBreakdownData | null;
    budget: BudgetPerformanceData | null;
    entity: EntityProfitabilityData | null;
  };
  loading: boolean;
  error: string | null;
}

export interface FinancialSettings {
  display: {
    currency: string;
    dateFormat: string;
    transactionListView: 'simple' | 'detailed';
    chartTheme: 'light' | 'dark' | 'system';
  };
  notifications: {
    budgetAlerts: boolean;
    budgetAlertThreshold: number; // percentage
    paymentReminders: boolean;
    reportGeneration: boolean;
    financialMilestones: boolean;
  };
  dataManagement: {
    exportFormats: ('pdf' | 'csv' | 'excel')[];
    includeAttachments: boolean;
    archiveAfterMonths: number;
    autoArchive: boolean;
  };
  categories: {
    customCategories: Array<{
      id: string;
      name: string;
      type: TransactionType;
      color: string;
      icon: string;
      group?: string;
    }>;
    defaultCategories: Record<string, string>; // category type -> default category id
  };
  budget: {
    defaultPeriodType: BudgetPeriodType;
    autoRenewal: boolean;
    reminderFrequency: 'daily' | 'weekly' | 'monthly';
    defaultAllocations: Record<string, number>; // category id -> percentage
  };
}

export interface FinancialReport {
  id: string;
  type: 'income_statement' | 'category_breakdown' | 'budget_performance' | 'entity_profitability' | 'custom';
  data: {
    summary?: Record<string, any>;
    details?: Record<string, any>;
    charts?: ChartData[];
    metadata?: {
      generatedAt: Date;
      period: {
        start: Date;
        end: Date;
      };
      filters?: Record<string, any>;
    };
  } | null;
  generatedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  exportPath?: string;
} 