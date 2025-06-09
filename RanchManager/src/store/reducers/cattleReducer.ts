import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  CattleState,
  Cattle,
  CattleGroup,
  WeightRecord,
  CattleFinancialSummary,
  CattleStatus,
  CattleBreed,
} from '../types/cattle';

const initialState: CattleState = {
  items: [],
  groups: [],
  weightRecords: [],
  financialSummaries: [],
  selectedCattleId: null,
  selectedGroupId: null,
  loading: false,
  error: null,
  filters: {},
};

const cattleSlice = createSlice({
  name: 'cattle',
  initialState,
  reducers: {
    setCattle: (state, action: PayloadAction<Cattle[]>) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    addCattle: (state, action: PayloadAction<Cattle>) => {
      state.items.push(action.payload);
    },
    updateCattle: (state, action: PayloadAction<Cattle>) => {
      const idx = state.items.findIndex((c) => c.id === action.payload.id);
      if (idx !== -1) state.items[idx] = action.payload;
    },
    deleteCattle: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((c) => c.id !== action.payload);
    },
    setGroups: (state, action: PayloadAction<CattleGroup[]>) => {
      state.groups = action.payload;
    },
    addGroup: (state, action: PayloadAction<CattleGroup>) => {
      state.groups.push(action.payload);
    },
    updateGroup: (state, action: PayloadAction<CattleGroup>) => {
      const idx = state.groups.findIndex((g) => g.id === action.payload.id);
      if (idx !== -1) state.groups[idx] = action.payload;
    },
    deleteGroup: (state, action: PayloadAction<string>) => {
      state.groups = state.groups.filter((g) => g.id !== action.payload);
    },
    setWeightRecords: (state, action: PayloadAction<WeightRecord[]>) => {
      state.weightRecords = action.payload;
    },
    addWeightRecord: (state, action: PayloadAction<WeightRecord>) => {
      state.weightRecords.push(action.payload);
    },
    setFinancialSummaries: (state, action: PayloadAction<CattleFinancialSummary[]>) => {
      state.financialSummaries = action.payload;
    },
    setSelectedCattle: (state, action: PayloadAction<string | null>) => {
      state.selectedCattleId = action.payload;
    },
    setSelectedGroup: (state, action: PayloadAction<string | null>) => {
      state.selectedGroupId = action.payload;
    },
    setCattleLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setCattleError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setCattleFilters: (state, action: PayloadAction<Partial<CattleState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
});

export const {
  setCattle,
  addCattle,
  updateCattle,
  deleteCattle,
  setGroups,
  addGroup,
  updateGroup,
  deleteGroup,
  setWeightRecords,
  addWeightRecord,
  setFinancialSummaries,
  setSelectedCattle,
  setSelectedGroup,
  setCattleLoading,
  setCattleError,
  setCattleFilters,
} = cattleSlice.actions;

export default cattleSlice.reducer; 