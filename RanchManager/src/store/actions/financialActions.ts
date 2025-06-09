import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  Transaction,
  Budget,
  Report,
  TransactionFilters,
  BudgetFilters,
  ReportFilters,
  FinancialSummary,
  ReportType,
} from '../types/financial';
import {
  setTransactions,
  setBudgets,
  setReports,
  setFinancialSummary,
  setTransactionsLoading,
  setBudgetsLoading,
  setReportsLoading,
  setSummaryLoading,
  setTransactionsError,
  setBudgetsError,
  setReportsError,
  setSummaryError,
} from '../reducers/financialReducer';
import { RootState } from '../store';
import { financialApi } from '../../services/api/financial';
import { firestore } from '../../services/firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase';
import { budgetApi } from '../../services/api/budgetApi';

// Transaction actions
export const fetchTransactions = createAsyncThunk(
  'financial/fetchTransactions',
  async (filters: TransactionFilters, { dispatch }) => {
    try {
      dispatch(setTransactionsLoading(true));
      const transactions = await financialApi.getTransactions(filters);
      dispatch(setTransactions(transactions));
      return transactions;
    } catch (error) {
      dispatch(setTransactionsError(error.message));
      throw error;
    }
  }
);

export const createTransaction = createAsyncThunk(
  'financial/createTransaction',
  async (transaction: Omit<Transaction, 'id'>, { dispatch }) => {
    try {
      const newTransaction = await financialApi.createTransaction(transaction);
      dispatch(fetchTransactions({}));
      return newTransaction;
    } catch (error) {
      dispatch(setTransactionsError(error.message));
      throw error;
    }
  }
);

export const updateTransaction = createAsyncThunk(
  'financial/updateTransaction',
  async (transaction: Transaction, { dispatch }) => {
    try {
      const updatedTransaction = await financialApi.updateTransaction(transaction);
      dispatch(fetchTransactions({}));
      return updatedTransaction;
    } catch (error) {
      dispatch(setTransactionsError(error.message));
      throw error;
    }
  }
);

export const deleteTransaction = createAsyncThunk(
  'financial/deleteTransaction',
  async (id: string, { dispatch }) => {
    try {
      await financialApi.deleteTransaction(id);
      dispatch(fetchTransactions({}));
    } catch (error) {
      dispatch(setTransactionsError(error.message));
      throw error;
    }
  }
);

// Budget actions
export const fetchBudgets = createAsyncThunk(
  'financial/fetchBudgets',
  async (_, { rejectWithValue }) => {
    try {
      return await budgetApi.getAll();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch budgets');
    }
  }
);

export const fetchBudget = createAsyncThunk(
  'financial/fetchBudget',
  async (id: string, { rejectWithValue }) => {
    try {
      return await budgetApi.getById(id);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch budget');
    }
  }
);

export const createBudget = createAsyncThunk(
  'financial/createBudget',
  async (budget: Omit<Budget, 'id'>, { rejectWithValue }) => {
    try {
      return await budgetApi.create(budget);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create budget');
    }
  }
);

export const updateBudget = createAsyncThunk(
  'financial/updateBudget',
  async ({ id, budget }: { id: string; budget: Partial<Budget> }, { rejectWithValue }) => {
    try {
      return await budgetApi.update(id, budget);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update budget');
    }
  }
);

export const deleteBudget = createAsyncThunk(
  'financial/deleteBudget',
  async (id: string, { rejectWithValue }) => {
    try {
      await budgetApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete budget');
    }
  }
);

// Report actions
export const fetchReports = createAsyncThunk(
  'financial/fetchReports',
  async (filters: ReportFilters, { dispatch }) => {
    try {
      dispatch(setReportsLoading(true));
      const reports = await financialApi.getReports(filters);
      dispatch(setReports(reports));
      return reports;
    } catch (error) {
      dispatch(setReportsError(error.message));
      throw error;
    }
  }
);

export const generateReport = createAsyncThunk(
  'financial/generateReport',
  async (
    {
      type,
      parameters,
    }: {
      type: ReportType;
      parameters: Record<string, any>;
    },
    { dispatch }
  ) => {
    try {
      const report = await financialApi.generateReport(type, parameters);
      dispatch(fetchReports({}));
      return report;
    } catch (error) {
      dispatch(setReportsError(error.message));
      throw error;
    }
  }
);

export const deleteReport = createAsyncThunk(
  'financial/deleteReport',
  async (id: string, { dispatch }) => {
    try {
      await financialApi.deleteReport(id);
      dispatch(fetchReports({}));
    } catch (error) {
      dispatch(setReportsError(error.message));
      throw error;
    }
  }
);

// Summary actions
export const fetchFinancialSummary = createAsyncThunk(
  'financial/fetchSummary',
  async (_, { dispatch, getState }) => {
    try {
      dispatch(setSummaryLoading(true));
      const state = getState() as RootState;
      const filters = state.financial.transactions.filters;
      const summary = await financialApi.getFinancialSummary(filters);
      dispatch(setFinancialSummary(summary));
      return summary;
    } catch (error) {
      dispatch(setSummaryError(error.message));
      throw error;
    }
  }
);

// Export actions
export const exportTransactions = createAsyncThunk(
  'financial/exportTransactions',
  async (
    {
      format,
      filters,
    }: {
      format: 'csv' | 'pdf';
      filters: TransactionFilters;
    },
    { dispatch }
  ) => {
    try {
      return await financialApi.exportTransactions(format, filters);
    } catch (error) {
      dispatch(setTransactionsError(error.message));
      throw error;
    }
  }
);

export const exportReport = createAsyncThunk(
  'financial/exportReport',
  async (
    {
      reportId,
      format,
    }: {
      reportId: string;
      format: 'csv' | 'pdf';
    },
    { dispatch }
  ) => {
    try {
      return await financialApi.exportReport(reportId, format);
    } catch (error) {
      dispatch(setReportsError(error.message));
      throw error;
    }
  }
); 