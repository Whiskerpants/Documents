import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HealthState, HealthRecord, HealthFilters } from '../types/health';

const initialState: HealthState = {
  records: [],
  selectedRecord: null,
  loading: false,
  error: null,
  filters: {},
  lastSync: null,
  isOffline: false,
};

const healthSlice = createSlice({
  name: 'health',
  initialState,
  reducers: {
    fetchHealthRecordsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchHealthRecordsSuccess: (state, action: PayloadAction<HealthRecord[]>) => {
      state.records = action.payload;
      state.loading = false;
      state.error = null;
      state.lastSync = new Date();
    },
    fetchHealthRecordsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    setSelectedRecord: (state, action: PayloadAction<HealthRecord | null>) => {
      state.selectedRecord = action.payload;
    },
    addHealthRecord: (state, action: PayloadAction<HealthRecord>) => {
      state.records.unshift(action.payload);
    },
    updateHealthRecord: (state, action: PayloadAction<HealthRecord>) => {
      const index = state.records.findIndex(record => record.id === action.payload.id);
      if (index !== -1) {
        state.records[index] = action.payload;
      }
      if (state.selectedRecord?.id === action.payload.id) {
        state.selectedRecord = action.payload;
      }
    },
    deleteHealthRecord: (state, action: PayloadAction<string>) => {
      state.records = state.records.filter(record => record.id !== action.payload);
      if (state.selectedRecord?.id === action.payload) {
        state.selectedRecord = null;
      }
    },
    setHealthFilters: (state, action: PayloadAction<Partial<HealthFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearHealthFilters: (state) => {
      state.filters = {};
    },
    setOfflineMode: (state, action: PayloadAction<boolean>) => {
      state.isOffline = action.payload;
    },
    clearHealthError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchHealthRecordsStart,
  fetchHealthRecordsSuccess,
  fetchHealthRecordsFailure,
  setSelectedRecord,
  addHealthRecord,
  updateHealthRecord,
  deleteHealthRecord,
  setHealthFilters,
  clearHealthFilters,
  setOfflineMode,
  clearHealthError,
} = healthSlice.actions;

export default healthSlice.reducer; 