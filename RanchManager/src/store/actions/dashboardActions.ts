import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchDashboardData } from '../../services/api/dashboard';
import {
  fetchDashboardStart,
  fetchDashboardSuccess,
  fetchDashboardFailure,
  setOfflineMode,
} from '../reducers/dashboardReducer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const DASHBOARD_CACHE_KEY = '@dashboard_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const fetchDashboard = createAsyncThunk(
  'dashboard/fetchDashboard',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(fetchDashboardStart());

      // Check network status
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;
      dispatch(setOfflineMode(!isConnected));

      if (!isConnected) {
        // Try to load from cache
        const cachedData = await AsyncStorage.getItem(DASHBOARD_CACHE_KEY);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          const isExpired = Date.now() - timestamp > CACHE_EXPIRY;

          if (!isExpired) {
            dispatch(fetchDashboardSuccess(data));
            return data;
          }
        }
        throw new Error('No internet connection and no valid cache available');
      }

      // Fetch fresh data
      const data = await fetchDashboardData();
      
      // Cache the data
      await AsyncStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));

      dispatch(fetchDashboardSuccess(data));
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dashboard data';
      dispatch(fetchDashboardFailure(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

export const refreshDashboard = createAsyncThunk(
  'dashboard/refreshDashboard',
  async (_, { dispatch }) => {
    try {
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;
      dispatch(setOfflineMode(!isConnected));

      if (!isConnected) {
        throw new Error('No internet connection available');
      }

      const data = await fetchDashboardData();
      
      // Update cache
      await AsyncStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));

      dispatch(fetchDashboardSuccess(data));
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh dashboard data';
      dispatch(fetchDashboardFailure(errorMessage));
      throw error;
    }
  }
);

export const clearDashboardCache = async () => {
  try {
    await AsyncStorage.removeItem(DASHBOARD_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing dashboard cache:', error);
  }
}; 