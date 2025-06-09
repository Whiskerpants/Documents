import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../types';
import { Transaction, TransactionType } from '../types/financial';

// Base selectors
const selectFinancialState = (state: RootState) => state.financial;
const selectTransactions = (state: RootState) => selectFinancialState(state).transactions;
const selectBudgets = (state: RootState) => selectFinancialState(state).budgets;
const selectReports = (state: RootState) => selectFinancialState(state).reports;

// Memoized selectors for transactions
export const selectTransactionsByDateRange = createSelector(
  [selectTransactions, (_, startDate: Date, endDate: Date) => ({ startDate, endDate })],
  (transactions, { startDate, endDate }) =>
    transactions.filter(
      t => t.date >= startDate && t.date <= endDate
    )
);

export const selectTransactionsByCategory = createSelector(
  [selectTransactions, (_, category: string) => category],
  (transactions, category) =>
    transactions.filter(t => t.category === category)
);

export const selectTransactionsByType = createSelector(
  [selectTransactions, (_, type: TransactionType) => type],
  (transactions, type) =>
    transactions.filter(t => t.type === type)
);

export const selectTransactionsByEntity = createSelector(
  [selectTransactions, (_, entityId: string) => entityId],
  (transactions, entityId) =>
    transactions.filter(t => t.relatedEntityId === entityId)
);

// Memoized selectors for financial calculations
export const selectTotalIncome = createSelector(
  [selectTransactions],
  transactions =>
    transactions
      .filter(t => t.type === TransactionType.Income)
      .reduce((sum, t) => sum + t.amount, 0)
);

export const selectTotalExpenses = createSelector(
  [selectTransactions],
  transactions =>
    transactions
      .filter(t => t.type === TransactionType.Expense)
      .reduce((sum, t) => sum + t.amount, 0)
);

export const selectNetProfit = createSelector(
  [selectTotalIncome, selectTotalExpenses],
  (income, expenses) => income - expenses
);

export const selectProfitMargin = createSelector(
  [selectTotalIncome, selectTotalExpenses],
  (income, expenses) => (income > 0 ? ((income - expenses) / income) * 100 : 0)
);

// Memoized selectors for category analysis
export const selectCategoryTotals = createSelector(
  [selectTransactions],
  transactions => {
    const totals: Record<string, { income: number; expenses: number }> = {};
    
    transactions.forEach(t => {
      if (!totals[t.category]) {
        totals[t.category] = { income: 0, expenses: 0 };
      }
      
      if (t.type === TransactionType.Income) {
        totals[t.category].income += t.amount;
      } else {
        totals[t.category].expenses += t.amount;
      }
    });
    
    return totals;
  }
);

// Memoized selectors for budget analysis
export const selectBudgetProgress = createSelector(
  [selectBudgets, selectCategoryTotals],
  (budgets, categoryTotals) =>
    budgets.map(budget => ({
      ...budget,
      spent: categoryTotals[budget.category]?.expenses || 0,
      remaining: budget.amount - (categoryTotals[budget.category]?.expenses || 0),
      progress: ((categoryTotals[budget.category]?.expenses || 0) / budget.amount) * 100,
    }))
);

// Memoized selectors for report generation
export const selectFinancialSummary = createSelector(
  [
    selectTotalIncome,
    selectTotalExpenses,
    selectNetProfit,
    selectProfitMargin,
    selectTransactions,
  ],
  (income, expenses, profit, margin, transactions) => ({
    totalIncome: income,
    totalExpenses: expenses,
    netProfit: profit,
    profitMargin: margin,
    transactionCount: transactions.length,
    averageTransactionAmount: transactions.length > 0
      ? (income + expenses) / transactions.length
      : 0,
  })
);

// Memoized selectors for pagination
export const selectPaginatedTransactions = createSelector(
  [
    selectTransactions,
    (_, page: number, pageSize: number) => ({ page, pageSize }),
  ],
  (transactions, { page, pageSize }) => {
    const start = page * pageSize;
    const end = start + pageSize;
    return transactions.slice(start, end);
  }
);

// Memoized selectors for search and filtering
export const selectFilteredTransactions = createSelector(
  [
    selectTransactions,
    (_, filters: {
      searchTerm?: string;
      categories?: string[];
      types?: TransactionType[];
      dateRange?: { start: Date; end: Date };
    }) => filters,
  ],
  (transactions, filters) => {
    return transactions.filter(t => {
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch =
          t.description.toLowerCase().includes(searchLower) ||
          t.category.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (filters.categories?.length) {
        if (!filters.categories.includes(t.category)) return false;
      }

      if (filters.types?.length) {
        if (!filters.types.includes(t.type)) return false;
      }

      if (filters.dateRange) {
        if (t.date < filters.dateRange.start || t.date > filters.dateRange.end) {
          return false;
        }
      }

      return true;
    });
  }
); 