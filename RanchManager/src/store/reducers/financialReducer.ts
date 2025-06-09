import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  Transaction,
  Budget,
  Report,
  TransactionFilters,
  BudgetFilters,
  ReportFilters,
  FinancialSummary,
  FinancialSettings,
} from '../types/financial';

interface FinancialState {
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
    filters: {
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

const initialState: FinancialState = {
  transactions: {
    items: [],
    selected: null,
    filters: {},
    loading: false,
    error: null,
  },
  budgets: {
    items: [],
    selected: null,
    loading: false,
    error: null,
    filters: {
      type: 'all',
      searchQuery: '',
    },
  },
  reports: {
    items: [],
    selected: null,
    loading: false,
    error: null,
  },
  summary: {
    current: null,
    loading: false,
    error: null,
  },
  settings: {
    display: {
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      transactionListView: 'simple',
      chartTheme: 'system',
    },
    notifications: {
      budgetAlerts: true,
      budgetAlertThreshold: 80,
      paymentReminders: true,
      reportGeneration: true,
      financialMilestones: true,
    },
    dataManagement: {
      exportFormats: ['pdf', 'csv'],
      includeAttachments: true,
      archiveAfterMonths: 12,
      autoArchive: true,
    },
    categories: {
      customCategories: [],
      defaultCategories: {},
    },
    budget: {
      defaultPeriodType: 'monthly',
      autoRenewal: true,
      reminderFrequency: 'weekly',
      defaultAllocations: {},
    },
  },
};

// Helper functions for budget calculations
const calculateBudgetProgress = (budget: Budget): number => {
  return (budget.spent / budget.total) * 100;
};

const calculateCategorySpending = (budget: Budget): Record<string, number> => {
  return Object.entries(budget.categoryAllocations).reduce((acc, [category, allocated]) => {
    acc[category] = (budget.categorySpent[category] || 0) / allocated;
    return acc;
  }, {} as Record<string, number>);
};

const getBudgetStatus = (budget: Budget): 'active' | 'expired' | 'upcoming' => {
  const now = new Date();
  const startDate = new Date(budget.startDate);
  const endDate = new Date(budget.endDate);

  if (now < startDate) return 'upcoming';
  if (now > endDate) return 'expired';
  return 'active';
};

const financialSlice = createSlice({
  name: 'financial',
  initialState,
  reducers: {
    // Transaction actions
    setTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.transactions.items = action.payload;
    },
    setSelectedTransaction: (state, action: PayloadAction<string | null>) => {
      state.transactions.selected = action.payload;
    },
    setTransactionFilters: (state, action: PayloadAction<TransactionFilters>) => {
      state.transactions.filters = action.payload;
    },
    setTransactionsLoading: (state, action: PayloadAction<boolean>) => {
      state.transactions.loading = action.payload;
    },
    setTransactionsError: (state, action: PayloadAction<string | null>) => {
      state.transactions.error = action.payload;
    },

    // Budget actions
    setBudgets: (state, action: PayloadAction<Budget[]>) => {
      state.budgets.items = action.payload;
    },
    setSelectedBudget: (state, action: PayloadAction<string | null>) => {
      state.budgets.selected = action.payload;
    },
    setBudgetFilters: (state, action: PayloadAction<{ type: 'all' | 'active' | 'inactive'; searchQuery: string }>) => {
      state.budgets.filters = action.payload;
    },
    clearBudgetFilters: (state) => {
      state.budgets.filters = initialState.budgets.filters;
    },
    setBudgetsLoading: (state, action: PayloadAction<boolean>) => {
      state.budgets.loading = action.payload;
    },
    setBudgetsError: (state, action: PayloadAction<string | null>) => {
      state.budgets.error = action.payload;
    },
    addBudget: (state, action: PayloadAction<Budget>) => {
      state.budgets.items.push(action.payload);
    },
    updateBudget: (state, action: PayloadAction<Budget>) => {
      const index = state.budgets.items.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.budgets.items[index] = action.payload;
      }
    },
    deleteBudget: (state, action: PayloadAction<string>) => {
      state.budgets.items = state.budgets.items.filter(b => b.id !== action.payload);
      if (state.budgets.selected === action.payload) {
        state.budgets.selected = null;
      }
    },

    // Report actions
    setReports: (state, action: PayloadAction<Report[]>) => {
      state.reports.items = action.payload;
    },
    setSelectedReport: (state, action: PayloadAction<string | null>) => {
      state.reports.selected = action.payload;
    },
    setReportsLoading: (state, action: PayloadAction<boolean>) => {
      state.reports.loading = action.payload;
    },
    setReportsError: (state, action: PayloadAction<string | null>) => {
      state.reports.error = action.payload;
    },

    // Summary actions
    setFinancialSummary: (state, action: PayloadAction<FinancialSummary>) => {
      state.summary.current = action.payload;
    },
    setSummaryLoading: (state, action: PayloadAction<boolean>) => {
      state.summary.loading = action.payload;
    },
    setSummaryError: (state, action: PayloadAction<string | null>) => {
      state.summary.error = action.payload;
    },

    // Settings actions
    updateFinancialSettings: (state, action: PayloadAction<Partial<FinancialSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
  },
});

export const {
  setTransactions,
  setSelectedTransaction,
  setTransactionFilters,
  setTransactionsLoading,
  setTransactionsError,
  setBudgets,
  setSelectedBudget,
  setBudgetFilters,
  clearBudgetFilters,
  setBudgetsLoading,
  setBudgetsError,
  addBudget,
  updateBudget,
  deleteBudget,
  setReports,
  setSelectedReport,
  setReportsLoading,
  setReportsError,
  setFinancialSummary,
  setSummaryLoading,
  setSummaryError,
  updateFinancialSettings,
} = financialSlice.actions;

export default financialSlice.reducer; 