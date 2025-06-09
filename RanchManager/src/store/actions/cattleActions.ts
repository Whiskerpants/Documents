import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  setCattle,
  setGroups,
  setWeightRecords,
  setFinancialSummaries,
  setCattleLoading,
  setCattleError,
} from '../reducers/cattleReducer';
import {
  Cattle,
  CattleGroup,
  WeightRecord,
  CattleFinancialSummary,
} from '../types/cattle';

// Mock API functions
const mockFetchCattle = async (): Promise<Cattle[]> => {
  return [
    {
      id: '1',
      tagNumber: 'A001',
      gender: 'female',
      breed: 'angus',
      birthDate: new Date('2020-01-01'),
      status: 'active',
      createdAt: new Date('2020-01-01'),
      updatedAt: new Date(),
    },
  ];
};

const mockFetchGroups = async (): Promise<CattleGroup[]> => {
  return [
    {
      id: 'g1',
      name: 'Group 1',
      cattleIds: ['1'],
      createdAt: new Date('2020-01-01'),
      updatedAt: new Date(),
    },
  ];
};

const mockFetchWeightRecords = async (): Promise<WeightRecord[]> => {
  return [
    {
      id: 'wr1',
      cattleId: '1',
      date: new Date('2021-01-01'),
      weight: 500,
    },
  ];
};

const mockCalculateFinancialSummary = async (): Promise<CattleFinancialSummary[]> => {
  return [
    {
      cattleId: '1',
      totalIncome: 1000,
      totalExpenses: 400,
      netProfit: 600,
      roi: 150,
      lastUpdated: new Date(),
    },
  ];
};

export const fetchCattle = createAsyncThunk('cattle/fetchCattle', async (_, { dispatch }) => {
  try {
    dispatch(setCattleLoading(true));
    const cattle = await mockFetchCattle();
    dispatch(setCattle(cattle));
    dispatch(setCattleLoading(false));
  } catch (error: any) {
    dispatch(setCattleError(error.message));
  }
});

export const fetchGroups = createAsyncThunk('cattle/fetchGroups', async (_, { dispatch }) => {
  try {
    dispatch(setCattleLoading(true));
    const groups = await mockFetchGroups();
    dispatch(setGroups(groups));
    dispatch(setCattleLoading(false));
  } catch (error: any) {
    dispatch(setCattleError(error.message));
  }
});

export const fetchWeightRecords = createAsyncThunk('cattle/fetchWeightRecords', async (_, { dispatch }) => {
  try {
    dispatch(setCattleLoading(true));
    const records = await mockFetchWeightRecords();
    dispatch(setWeightRecords(records));
    dispatch(setCattleLoading(false));
  } catch (error: any) {
    dispatch(setCattleError(error.message));
  }
});

export const calculateFinancialSummaries = createAsyncThunk('cattle/calculateFinancialSummaries', async (_, { dispatch }) => {
  try {
    dispatch(setCattleLoading(true));
    const summaries = await mockCalculateFinancialSummary();
    dispatch(setFinancialSummaries(summaries));
    dispatch(setCattleLoading(false));
  } catch (error: any) {
    dispatch(setCattleError(error.message));
  }
}); 