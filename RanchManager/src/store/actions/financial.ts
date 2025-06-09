import { Dispatch } from 'redux';
import { mockApi } from '../../services/api';
import {
  Transaction,
  Budget,
  Report,
  ReportType,
  ReportParameters,
  TransactionFilters,
  BudgetFilters,
  FinancialSettings
} from '../types/financial';

// Transaction Actions
export const fetchTransactions = (filters?: TransactionFilters) => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: 'SET_LOADING', payload: { section: 'transactions', value: true } });
    dispatch({ type: 'CLEAR_ERROR', payload: { section: 'transactions' } });

    const response = await mockApi.getTransactions(filters);
    dispatch({ type: 'SET_TRANSACTIONS', payload: response.data });
  } catch (error) {
    dispatch({
      type: 'SET_ERROR',
      payload: {
        section: 'transactions',
        value: error instanceof Error ? error.message : 'An error occurred'
      }
    });
  } finally {
    dispatch({ type: 'SET_LOADING', payload: { section: 'transactions', value: false } });
  }
};

export const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: 'SET_LOADING', payload: { section: 'transactions', value: true } });
    dispatch({ type: 'CLEAR_ERROR', payload: { section: 'transactions' } });

    const response = await mockApi.createTransaction(transaction);
    dispatch({ type: 'ADD_TRANSACTION', payload: response.data });
  } catch (error) {
    dispatch({
      type: 'SET_ERROR',
      payload: {
        section: 'transactions',
        value: error instanceof Error ? error.message : 'An error occurred'
      }
    });
  } finally {
    dispatch({ type: 'SET_LOADING', payload: { section: 'transactions', value: false } });
  }
};

export const updateTransaction = (transaction: Transaction) => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: 'SET_LOADING', payload: { section: 'transactions', value: true } });
    dispatch({ type: 'CLEAR_ERROR', payload: { section: 'transactions' } });

    const response = await mockApi.updateTransaction(transaction);
    dispatch({ type: 'UPDATE_TRANSACTION', payload: response.data });
  } catch (error) {
    dispatch({
      type: 'SET_ERROR',
      payload: {
        section: 'transactions',
        value: error instanceof Error ? error.message : 'An error occurred'
      }
    });
  } finally {
    dispatch({ type: 'SET_LOADING', payload: { section: 'transactions', value: false } });
  }
};

export const deleteTransaction = (id: string) => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: 'SET_LOADING', payload: { section: 'transactions', value: true } });
    dispatch({ type: 'CLEAR_ERROR', payload: { section: 'transactions' } });

    await mockApi.deleteTransaction(id);
    dispatch({ type: 'DELETE_TRANSACTION', payload: id });
  } catch (error) {
    dispatch({
      type: 'SET_ERROR',
      payload: {
        section: 'transactions',
        value: error instanceof Error ? error.message : 'An error occurred'
      }
    });
  } finally {
    dispatch({ type: 'SET_LOADING', payload: { section: 'transactions', value: false } });
  }
};

// Budget Actions
export const fetchBudgets = (filters?: BudgetFilters) => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: 'SET_LOADING', payload: { section: 'budgets', value: true } });
    dispatch({ type: 'CLEAR_ERROR', payload: { section: 'budgets' } });

    const response = await mockApi.getBudgets(filters);
    dispatch({ type: 'SET_BUDGETS', payload: response.data });
  } catch (error) {
    dispatch({
      type: 'SET_ERROR',
      payload: {
        section: 'budgets',
        value: error instanceof Error ? error.message : 'An error occurred'
      }
    });
  } finally {
    dispatch({ type: 'SET_LOADING', payload: { section: 'budgets', value: false } });
  }
};

export const addBudget = (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: 'SET_LOADING', payload: { section: 'budgets', value: true } });
    dispatch({ type: 'CLEAR_ERROR', payload: { section: 'budgets' } });

    const response = await mockApi.createBudget(budget);
    dispatch({ type: 'ADD_BUDGET', payload: response.data });
  } catch (error) {
    dispatch({
      type: 'SET_ERROR',
      payload: {
        section: 'budgets',
        value: error instanceof Error ? error.message : 'An error occurred'
      }
    });
  } finally {
    dispatch({ type: 'SET_LOADING', payload: { section: 'budgets', value: false } });
  }
};

export const updateBudget = (budget: Budget) => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: 'SET_LOADING', payload: { section: 'budgets', value: true } });
    dispatch({ type: 'CLEAR_ERROR', payload: { section: 'budgets' } });

    const response = await mockApi.updateBudget(budget);
    dispatch({ type: 'UPDATE_BUDGET', payload: response.data });
  } catch (error) {
    dispatch({
      type: 'SET_ERROR',
      payload: {
        section: 'budgets',
        value: error instanceof Error ? error.message : 'An error occurred'
      }
    });
  } finally {
    dispatch({ type: 'SET_LOADING', payload: { section: 'budgets', value: false } });
  }
};

export const deleteBudget = (id: string) => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: 'SET_LOADING', payload: { section: 'budgets', value: true } });
    dispatch({ type: 'CLEAR_ERROR', payload: { section: 'budgets' } });

    await mockApi.deleteBudget(id);
    dispatch({ type: 'DELETE_BUDGET', payload: id });
  } catch (error) {
    dispatch({
      type: 'SET_ERROR',
      payload: {
        section: 'budgets',
        value: error instanceof Error ? error.message : 'An error occurred'
      }
    });
  } finally {
    dispatch({ type: 'SET_LOADING', payload: { section: 'budgets', value: false } });
  }
};

// Report Actions
export const generateReport = (
  type: ReportType,
  parameters: ReportParameters
) => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: 'SET_LOADING', payload: { section: 'reports', value: true } });
    dispatch({ type: 'CLEAR_ERROR', payload: { section: 'reports' } });

    const response = await mockApi.generateReport(type, parameters);
    dispatch({
      type: 'SET_REPORT',
      payload: {
        id: response.data.id,
        name: response.data.name,
        type,
        parameters,
        dateGenerated: new Date(),
        results: response.data.results,
        createdAt: new Date(),
        createdBy: 'current_user' // TODO: Get from auth context
      }
    });
  } catch (error) {
    dispatch({
      type: 'SET_ERROR',
      payload: {
        section: 'reports',
        value: error instanceof Error ? error.message : 'An error occurred'
      }
    });
  } finally {
    dispatch({ type: 'SET_LOADING', payload: { section: 'reports', value: false } });
  }
};

export const exportReport = (
  reportId: string,
  format: 'pdf' | 'csv'
) => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: 'SET_LOADING', payload: { section: 'reports', value: true } });
    dispatch({ type: 'CLEAR_ERROR', payload: { section: 'reports' } });

    const response = await mockApi.exportReport(reportId, format);
    return response.data;
  } catch (error) {
    dispatch({
      type: 'SET_ERROR',
      payload: {
        section: 'reports',
        value: error instanceof Error ? error.message : 'An error occurred'
      }
    });
    return null;
  } finally {
    dispatch({ type: 'SET_LOADING', payload: { section: 'reports', value: false } });
  }
};

export const updateFinancialSettings = (settings: FinancialSettings) => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: 'SET_LOADING', payload: { section: 'settings', value: true } });
    dispatch({ type: 'CLEAR_ERROR', payload: { section: 'settings' } });

    const response = await mockApi.updateFinancialSettings(settings);
    dispatch({ type: 'UPDATE_FINANCIAL_SETTINGS', payload: response.data });
  } catch (error) {
    dispatch({
      type: 'SET_ERROR',
      payload: {
        section: 'settings',
        value: error instanceof Error ? error.message : 'An error occurred'
      }
    });
  } finally {
    dispatch({ type: 'SET_LOADING', payload: { section: 'settings', value: false } });
  }
}; 