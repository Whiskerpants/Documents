import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchHealthRecordsStart,
  fetchHealthRecordsSuccess,
  fetchHealthRecordsFailure,
  setOfflineMode,
  addHealthRecord,
  updateHealthRecord,
  deleteHealthRecord,
} from '../reducers/healthReducer';
import {
  fetchHealthRecords,
  createHealthRecord,
  updateHealthRecord as updateHealthRecordApi,
  deleteHealthRecord as deleteHealthRecordApi,
} from '../../services/api/health';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { HealthFilters, CreateHealthRecordInput, UpdateHealthRecordInput } from '../types/health';

const HEALTH_CACHE_KEY = '@health_records_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const fetchHealthRecordsAction = createAsyncThunk(
  'health/fetchHealthRecords',
  async (filters?: HealthFilters, { dispatch, rejectWithValue }) => {
    try {
      dispatch(fetchHealthRecordsStart());

      // Check network status
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;
      dispatch(setOfflineMode(!isConnected));

      if (!isConnected) {
        // Try to load from cache
        const cachedData = await AsyncStorage.getItem(HEALTH_CACHE_KEY);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          const isExpired = Date.now() - timestamp > CACHE_EXPIRY;

          if (!isExpired) {
            dispatch(fetchHealthRecordsSuccess(data));
            return data;
          }
        }
        throw new Error('No internet connection and no valid cache available');
      }

      // Fetch fresh data
      const records = await fetchHealthRecords(filters);
      
      // Cache the data
      await AsyncStorage.setItem(HEALTH_CACHE_KEY, JSON.stringify({
        data: records,
        timestamp: Date.now(),
      }));

      dispatch(fetchHealthRecordsSuccess(records));
      return records;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch health records';
      dispatch(fetchHealthRecordsFailure(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

export const createHealthRecordAction = createAsyncThunk(
  'health/createHealthRecord',
  async (record: CreateHealthRecordInput, { dispatch, rejectWithValue }) => {
    try {
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;
      dispatch(setOfflineMode(!isConnected));

      if (!isConnected) {
        throw new Error('No internet connection available');
      }

      const newRecord = await createHealthRecord(record);
      dispatch(addHealthRecord(newRecord));
      return newRecord;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create health record';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateHealthRecordAction = createAsyncThunk(
  'health/updateHealthRecord',
  async (
    { id, updates }: { id: string; updates: UpdateHealthRecordInput },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;
      dispatch(setOfflineMode(!isConnected));

      if (!isConnected) {
        throw new Error('No internet connection available');
      }

      const updatedRecord = await updateHealthRecordApi(id, updates);
      dispatch(updateHealthRecord(updatedRecord));
      return updatedRecord;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update health record';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteHealthRecordAction = createAsyncThunk(
  'health/deleteHealthRecord',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;
      dispatch(setOfflineMode(!isConnected));

      if (!isConnected) {
        throw new Error('No internet connection available');
      }

      await deleteHealthRecordApi(id);
      dispatch(deleteHealthRecord(id));
      return id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete health record';
      return rejectWithValue(errorMessage);
    }
  }
);

export const clearHealthCache = async () => {
  try {
    await AsyncStorage.removeItem(HEALTH_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing health records cache:', error);
  }
}; 