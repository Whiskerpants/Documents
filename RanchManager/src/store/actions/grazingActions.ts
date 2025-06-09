import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchPasturesStart,
  fetchPasturesSuccess,
  fetchPasturesFailure,
  fetchGrazingPlansStart,
  fetchGrazingPlansSuccess,
  fetchGrazingPlansFailure,
  setOfflineMode,
  addPasture,
  updatePasture,
  deletePasture,
  addGrazingPlan,
  updateGrazingPlan,
  deleteGrazingPlan,
} from '../reducers/grazingReducer';
import {
  fetchPastures,
  createPasture,
  updatePasture as updatePastureApi,
  deletePasture as deletePastureApi,
  fetchGrazingPlans,
  createGrazingPlan,
  updateGrazingPlan as updateGrazingPlanApi,
  deleteGrazingPlan as deleteGrazingPlanApi,
} from '../../services/api/grazing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  GrazingFilters,
  CreatePastureInput,
  UpdatePastureInput,
  CreateGrazingPlanInput,
  UpdateGrazingPlanInput,
} from '../types/grazing';
import { GrazingState, Pasture, GrazingEvent } from '../../types/grazing';
import { api } from '../../services/api';

const GRAZING_CACHE_KEY = '@grazing_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Pasture Actions
export const fetchPasturesAction = createAsyncThunk(
  'grazing/fetchPastures',
  async (filters: GrazingFilters, { dispatch, rejectWithValue }) => {
    try {
      dispatch(fetchPasturesStart());

      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;
      dispatch(setOfflineMode(!isConnected));

      if (!isConnected) {
        const cachedData = await AsyncStorage.getItem(GRAZING_CACHE_KEY);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          const isExpired = Date.now() - timestamp > CACHE_EXPIRY;

          if (!isExpired) {
            dispatch(fetchPasturesSuccess(data.pastures));
            return data.pastures;
          }
        }
        throw new Error('No internet connection and no valid cache available');
      }

      const pastures = await fetchPastures(filters);
      
      await AsyncStorage.setItem(GRAZING_CACHE_KEY, JSON.stringify({
        data: { pastures },
        timestamp: Date.now(),
      }));

      dispatch(fetchPasturesSuccess(pastures));
      return pastures;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch pastures';
      dispatch(fetchPasturesFailure(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

export const createPastureAction = createAsyncThunk(
  'grazing/createPasture',
  async (pasture: CreatePastureInput, { dispatch, rejectWithValue }) => {
    try {
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;
      dispatch(setOfflineMode(!isConnected));

      if (!isConnected) {
        throw new Error('No internet connection available');
      }

      const newPasture = await createPasture(pasture);
      dispatch(addPasture(newPasture));
      return newPasture;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create pasture';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updatePastureAction = createAsyncThunk(
  'grazing/updatePasture',
  async (
    { id, updates }: { id: string; updates: UpdatePastureInput },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;
      dispatch(setOfflineMode(!isConnected));

      if (!isConnected) {
        throw new Error('No internet connection available');
      }

      const updatedPasture = await updatePastureApi(id, updates);
      dispatch(updatePasture(updatedPasture));
      return updatedPasture;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update pasture';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deletePastureAction = createAsyncThunk(
  'grazing/deletePasture',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;
      dispatch(setOfflineMode(!isConnected));

      if (!isConnected) {
        throw new Error('No internet connection available');
      }

      await deletePastureApi(id);
      dispatch(deletePasture(id));
      return id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete pasture';
      return rejectWithValue(errorMessage);
    }
  }
);

// Grazing Plan Actions
export const fetchGrazingPlansAction = createAsyncThunk(
  'grazing/fetchGrazingPlans',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(fetchGrazingPlansStart());

      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;
      dispatch(setOfflineMode(!isConnected));

      if (!isConnected) {
        const cachedData = await AsyncStorage.getItem(GRAZING_CACHE_KEY);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          const isExpired = Date.now() - timestamp > CACHE_EXPIRY;

          if (!isExpired) {
            dispatch(fetchGrazingPlansSuccess(data.grazingPlans));
            return data.grazingPlans;
          }
        }
        throw new Error('No internet connection and no valid cache available');
      }

      const plans = await fetchGrazingPlans();
      
      const cachedData = await AsyncStorage.getItem(GRAZING_CACHE_KEY);
      const existingData = cachedData ? JSON.parse(cachedData).data : {};
      
      await AsyncStorage.setItem(GRAZING_CACHE_KEY, JSON.stringify({
        data: { ...existingData, grazingPlans: plans },
        timestamp: Date.now(),
      }));

      dispatch(fetchGrazingPlansSuccess(plans));
      return plans;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch grazing plans';
      dispatch(fetchGrazingPlansFailure(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

export const createGrazingPlanAction = createAsyncThunk(
  'grazing/createGrazingPlan',
  async (plan: CreateGrazingPlanInput, { dispatch, rejectWithValue }) => {
    try {
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;
      dispatch(setOfflineMode(!isConnected));

      if (!isConnected) {
        throw new Error('No internet connection available');
      }

      const newPlan = await createGrazingPlan(plan);
      dispatch(addGrazingPlan(newPlan));
      return newPlan;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create grazing plan';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateGrazingPlanAction = createAsyncThunk(
  'grazing/updateGrazingPlan',
  async (
    { id, updates }: { id: string; updates: UpdateGrazingPlanInput },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;
      dispatch(setOfflineMode(!isConnected));

      if (!isConnected) {
        throw new Error('No internet connection available');
      }

      const updatedPlan = await updateGrazingPlanApi(id, updates);
      dispatch(updateGrazingPlan(updatedPlan));
      return updatedPlan;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update grazing plan';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteGrazingPlanAction = createAsyncThunk(
  'grazing/deleteGrazingPlan',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;
      dispatch(setOfflineMode(!isConnected));

      if (!isConnected) {
        throw new Error('No internet connection available');
      }

      await deleteGrazingPlanApi(id);
      dispatch(deleteGrazingPlan(id));
      return id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete grazing plan';
      return rejectWithValue(errorMessage);
    }
  }
);

export const clearGrazingCache = async () => {
  try {
    await AsyncStorage.removeItem(GRAZING_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing grazing cache:', error);
  }
};

// Fetch grazing events
export const fetchGrazingEvents = createAsyncThunk<GrazingEvent[]>(
  'grazing/fetchGrazingEvents',
  async () => {
    const response = await api.get('/api/grazing-events');
    return response.data;
  }
);

// Add grazing event
export const addGrazingEvent = createAsyncThunk<GrazingEvent, Omit<GrazingEvent, 'id'>>(
  'grazing/addGrazingEvent',
  async (event) => {
    const response = await api.post('/api/grazing-events', event);
    return response.data;
  }
);

// Update grazing event
export const updateGrazingEvent = createAsyncThunk<GrazingEvent, GrazingEvent>(
  'grazing/updateGrazingEvent',
  async (event) => {
    const response = await api.put(`/api/grazing-events/${event.id}`, event);
    return response.data;
  }
); 