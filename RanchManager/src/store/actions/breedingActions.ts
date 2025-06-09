import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchBreedingsStart,
  fetchBreedingsSuccess,
  fetchBreedingsFailure,
  fetchPregnanciesStart,
  fetchPregnanciesSuccess,
  fetchPregnanciesFailure,
  fetchBirthsStart,
  fetchBirthsSuccess,
  fetchBirthsFailure,
  fetchLineageRecordsStart,
  fetchLineageRecordsSuccess,
  fetchLineageRecordsFailure,
  fetchGeneticProfilesStart,
  fetchGeneticProfilesSuccess,
  fetchGeneticProfilesFailure,
  setOfflineMode,
  addBreeding,
  updateBreeding,
  deleteBreeding,
  addPregnancy,
  updatePregnancy,
  deletePregnancy,
  addBirth,
  updateBirth,
  deleteBirth,
  addLineageRecord,
  updateLineageRecord,
  addGeneticProfile,
  updateGeneticProfile,
} from '../reducers/breedingReducer';
import {
  fetchBreedings,
  createBreeding,
  updateBreeding as updateBreedingApi,
  deleteBreeding as deleteBreedingApi,
  fetchPregnancies,
  createPregnancy,
  updatePregnancy as updatePregnancyApi,
  deletePregnancy as deletePregnancyApi,
  fetchBirths,
  createBirth,
  updateBirth as updateBirthApi,
  deleteBirth as deleteBirthApi,
  fetchLineageRecords,
  createLineageRecord,
  updateLineageRecord as updateLineageRecordApi,
  fetchGeneticProfiles,
  createGeneticProfile,
  updateGeneticProfile as updateGeneticProfileApi,
} from '../../services/api/breeding';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  BreedingFilters,
  PregnancyFilters,
  CreateBreedingInput,
  UpdateBreedingInput,
  CreatePregnancyInput,
  UpdatePregnancyInput,
  CreateBirthInput,
  UpdateBirthInput,
} from '../types/breeding';

const BREEDING_CACHE_KEY = '@breeding_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Breeding Actions
export const fetchBreedingsAction = createAsyncThunk(
  'breeding/fetchBreedings',
  async (filters: BreedingFilters, { dispatch, rejectWithValue }) => {
    try {
      dispatch(fetchBreedingsStart());

      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;
      dispatch(setOfflineMode(!isConnected));

      if (!isConnected) {
        const cachedData = await AsyncStorage.getItem(BREEDING_CACHE_KEY);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          const isExpired = Date.now() - timestamp > CACHE_EXPIRY;

          if (!isExpired) {
            dispatch(fetchBreedingsSuccess(data.breedings));
            return data.breedings;
          }
        }
        throw new Error('No internet connection and no valid cache available');
      }

      const breedings = await fetchBreedings(filters);
      
      await AsyncStorage.setItem(BREEDING_CACHE_KEY, JSON.stringify({
        data: { breedings },
        timestamp: Date.now(),
      }));

      dispatch(fetchBreedingsSuccess(breedings));
      return breedings;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch breeding records';
      dispatch(fetchBreedingsFailure(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

export const createBreedingAction = createAsyncThunk(
  'breeding/createBreeding',
  async (breeding: CreateBreedingInput, { dispatch, rejectWithValue }) => {
    try {
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;
      dispatch(setOfflineMode(!isConnected));

      if (!isConnected) {
        throw new Error('No internet connection available');
      }

      const newBreeding = await createBreeding(breeding);
      dispatch(addBreeding(newBreeding));
      return newBreeding;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create breeding record';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateBreedingAction = createAsyncThunk(
  'breeding/updateBreeding',
  async (
    { id, updates }: { id: string; updates: UpdateBreedingInput },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;
      dispatch(setOfflineMode(!isConnected));

      if (!isConnected) {
        throw new Error('No internet connection available');
      }

      const updatedBreeding = await updateBreedingApi(id, updates);
      dispatch(updateBreeding(updatedBreeding));
      return updatedBreeding;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update breeding record';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteBreedingAction = createAsyncThunk(
  'breeding/deleteBreeding',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;
      dispatch(setOfflineMode(!isConnected));

      if (!isConnected) {
        throw new Error('No internet connection available');
      }

      await deleteBreedingApi(id);
      dispatch(deleteBreeding(id));
      return id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete breeding record';
      return rejectWithValue(errorMessage);
    }
  }
);

// Pregnancy Actions
export const fetchPregnanciesAction = createAsyncThunk(
  'breeding/fetchPregnancies',
  async (filters: PregnancyFilters, { dispatch, rejectWithValue }) => {
    try {
      dispatch(fetchPregnanciesStart());

      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;
      dispatch(setOfflineMode(!isConnected));

      if (!isConnected) {
        const cachedData = await AsyncStorage.getItem(BREEDING_CACHE_KEY);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          const isExpired = Date.now() - timestamp > CACHE_EXPIRY;

          if (!isExpired) {
            dispatch(fetchPregnanciesSuccess(data.pregnancies));
            return data.pregnancies;
          }
        }
        throw new Error('No internet connection and no valid cache available');
      }

      const pregnancies = await fetchPregnancies(filters);
      
      const cachedData = await AsyncStorage.getItem(BREEDING_CACHE_KEY);
      const existingData = cachedData ? JSON.parse(cachedData).data : {};
      
      await AsyncStorage.setItem(BREEDING_CACHE_KEY, JSON.stringify({
        data: { ...existingData, pregnancies },
        timestamp: Date.now(),
      }));

      dispatch(fetchPregnanciesSuccess(pregnancies));
      return pregnancies;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch pregnancy records';
      dispatch(fetchPregnanciesFailure(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

export const createPregnancyAction = createAsyncThunk(
  'breeding/createPregnancy',
  async (pregnancy: CreatePregnancyInput, { dispatch, rejectWithValue }) => {
    try {
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;
      dispatch(setOfflineMode(!isConnected));

      if (!isConnected) {
        throw new Error('No internet connection available');
      }

      const newPregnancy = await createPregnancy(pregnancy);
      dispatch(addPregnancy(newPregnancy));
      return newPregnancy;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create pregnancy record';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updatePregnancyAction = createAsyncThunk(
  'breeding/updatePregnancy',
  async (
    { id, updates }: { id: string; updates: UpdatePregnancyInput },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;
      dispatch(setOfflineMode(!isConnected));

      if (!isConnected) {
        throw new Error('No internet connection available');
      }

      const updatedPregnancy = await updatePregnancyApi(id, updates);
      dispatch(updatePregnancy(updatedPregnancy));
      return updatedPregnancy;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update pregnancy record';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deletePregnancyAction = createAsyncThunk(
  'breeding/deletePregnancy',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;
      dispatch(setOfflineMode(!isConnected));

      if (!isConnected) {
        throw new Error('No internet connection available');
      }

      await deletePregnancyApi(id);
      dispatch(deletePregnancy(id));
      return id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete pregnancy record';
      return rejectWithValue(errorMessage);
    }
  }
);

// Birth Actions
export const fetchBirthsAction = createAsyncThunk(
  'breeding/fetchBirths',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(fetchBirthsStart());

      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;
      dispatch(setOfflineMode(!isConnected));

      if (!isConnected) {
        const cachedData = await AsyncStorage.getItem(BREEDING_CACHE_KEY);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          const isExpired = Date.now() - timestamp > CACHE_EXPIRY;

          if (!isExpired) {
            dispatch(fetchBirthsSuccess(data.births));
            return data.births;
          }
        }
        throw new Error('No internet connection and no valid cache available');
      }

      const births = await fetchBirths();
      
      const cachedData = await AsyncStorage.getItem(BREEDING_CACHE_KEY);
      const existingData = cachedData ? JSON.parse(cachedData).data : {};
      
      await AsyncStorage.setItem(BREEDING_CACHE_KEY, JSON.stringify({
        data: { ...existingData, births },
        timestamp: Date.now(),
      }));

      dispatch(fetchBirthsSuccess(births));
      return births;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch birth records';
      dispatch(fetchBirthsFailure(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

export const createBirthAction = createAsyncThunk(
  'breeding/createBirth',
  async (birth: CreateBirthInput, { dispatch, rejectWithValue }) => {
    try {
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;
      dispatch(setOfflineMode(!isConnected));

      if (!isConnected) {
        throw new Error('No internet connection available');
      }

      const newBirth = await createBirth(birth);
      dispatch(addBirth(newBirth));
      return newBirth;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create birth record';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateBirthAction = createAsyncThunk(
  'breeding/updateBirth',
  async (
    { id, updates }: { id: string; updates: UpdateBirthInput },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;
      dispatch(setOfflineMode(!isConnected));

      if (!isConnected) {
        throw new Error('No internet connection available');
      }

      const updatedBirth = await updateBirthApi(id, updates);
      dispatch(updateBirth(updatedBirth));
      return updatedBirth;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update birth record';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteBirthAction = createAsyncThunk(
  'breeding/deleteBirth',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;
      dispatch(setOfflineMode(!isConnected));

      if (!isConnected) {
        throw new Error('No internet connection available');
      }

      await deleteBirthApi(id);
      dispatch(deleteBirth(id));
      return id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete birth record';
      return rejectWithValue(errorMessage);
    }
  }
);

// Lineage Actions
export const fetchLineageRecordsAction = createAsyncThunk(
  'breeding/fetchLineageRecords',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(fetchLineageRecordsStart());

      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;
      dispatch(setOfflineMode(!isConnected));

      if (!isConnected) {
        const cachedData = await AsyncStorage.getItem(BREEDING_CACHE_KEY);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          const isExpired = Date.now() - timestamp > CACHE_EXPIRY;

          if (!isExpired) {
            dispatch(fetchLineageRecordsSuccess(data.lineageRecords));
            return data.lineageRecords;
          }
        }
        throw new Error('No internet connection and no valid cache available');
      }

      const lineageRecords = await fetchLineageRecords();
      
      const cachedData = await AsyncStorage.getItem(BREEDING_CACHE_KEY);
      const existingData = cachedData ? JSON.parse(cachedData).data : {};
      
      await AsyncStorage.setItem(BREEDING_CACHE_KEY, JSON.stringify({
        data: { ...existingData, lineageRecords },
        timestamp: Date.now(),
      }));

      dispatch(fetchLineageRecordsSuccess(lineageRecords));
      return lineageRecords;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch lineage records';
      dispatch(fetchLineageRecordsFailure(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

// Genetic Profile Actions
export const fetchGeneticProfilesAction = createAsyncThunk(
  'breeding/fetchGeneticProfiles',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(fetchGeneticProfilesStart());

      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;
      dispatch(setOfflineMode(!isConnected));

      if (!isConnected) {
        const cachedData = await AsyncStorage.getItem(BREEDING_CACHE_KEY);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          const isExpired = Date.now() - timestamp > CACHE_EXPIRY;

          if (!isExpired) {
            dispatch(fetchGeneticProfilesSuccess(data.geneticProfiles));
            return data.geneticProfiles;
          }
        }
        throw new Error('No internet connection and no valid cache available');
      }

      const geneticProfiles = await fetchGeneticProfiles();
      
      const cachedData = await AsyncStorage.getItem(BREEDING_CACHE_KEY);
      const existingData = cachedData ? JSON.parse(cachedData).data : {};
      
      await AsyncStorage.setItem(BREEDING_CACHE_KEY, JSON.stringify({
        data: { ...existingData, geneticProfiles },
        timestamp: Date.now(),
      }));

      dispatch(fetchGeneticProfilesSuccess(geneticProfiles));
      return geneticProfiles;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch genetic profiles';
      dispatch(fetchGeneticProfilesFailure(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

export const clearBreedingCache = async () => {
  try {
    await AsyncStorage.removeItem(BREEDING_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing breeding cache:', error);
  }
}; 