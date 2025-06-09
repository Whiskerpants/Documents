import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  BreedingState,
  Breeding,
  Pregnancy,
  Birth,
  LineageRecord,
  GeneticProfile,
  BreedingFilters,
  PregnancyFilters,
  BreedingStatus,
  PregnancyStatus,
} from '../types/breeding';

const initialState: BreedingState = {
  breedings: [],
  pregnancies: [],
  births: [],
  lineageRecords: [],
  geneticProfiles: [],
  selectedBreeding: null,
  selectedPregnancy: null,
  selectedBirth: null,
  loading: false,
  error: null,
  filters: {},
  pregnancyFilters: {},
  lastSync: null,
  isOffline: false,
};

const breedingSlice = createSlice({
  name: 'breeding',
  initialState,
  reducers: {
    // Breeding Records
    fetchBreedingsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchBreedingsSuccess: (state, action: PayloadAction<Breeding[]>) => {
      state.breedings = action.payload;
      state.loading = false;
      state.error = null;
      state.lastSync = new Date();
    },
    fetchBreedingsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    setSelectedBreeding: (state, action: PayloadAction<Breeding | null>) => {
      state.selectedBreeding = action.payload;
    },
    addBreeding: (state, action: PayloadAction<Breeding>) => {
      state.breedings.unshift(action.payload);
    },
    updateBreeding: (state, action: PayloadAction<Breeding>) => {
      const index = state.breedings.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.breedings[index] = action.payload;
      }
      if (state.selectedBreeding?.id === action.payload.id) {
        state.selectedBreeding = action.payload;
      }
    },
    deleteBreeding: (state, action: PayloadAction<string>) => {
      state.breedings = state.breedings.filter(b => b.id !== action.payload);
      if (state.selectedBreeding?.id === action.payload) {
        state.selectedBreeding = null;
      }
    },

    // Pregnancy Records
    fetchPregnanciesStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchPregnanciesSuccess: (state, action: PayloadAction<Pregnancy[]>) => {
      state.pregnancies = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchPregnanciesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    setSelectedPregnancy: (state, action: PayloadAction<Pregnancy | null>) => {
      state.selectedPregnancy = action.payload;
    },
    addPregnancy: (state, action: PayloadAction<Pregnancy>) => {
      state.pregnancies.unshift(action.payload);
      // Update related breeding record status
      const breeding = state.breedings.find(b => b.id === action.payload.breedingId);
      if (breeding) {
        breeding.status = BreedingStatus.Confirmed;
      }
    },
    updatePregnancy: (state, action: PayloadAction<Pregnancy>) => {
      const index = state.pregnancies.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.pregnancies[index] = action.payload;
      }
      if (state.selectedPregnancy?.id === action.payload.id) {
        state.selectedPregnancy = action.payload;
      }
    },
    deletePregnancy: (state, action: PayloadAction<string>) => {
      const pregnancy = state.pregnancies.find(p => p.id === action.payload);
      if (pregnancy) {
        // Reset related breeding record status
        const breeding = state.breedings.find(b => b.id === pregnancy.breedingId);
        if (breeding) {
          breeding.status = BreedingStatus.Pending;
        }
      }
      state.pregnancies = state.pregnancies.filter(p => p.id !== action.payload);
      if (state.selectedPregnancy?.id === action.payload) {
        state.selectedPregnancy = null;
      }
    },

    // Birth Records
    fetchBirthsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchBirthsSuccess: (state, action: PayloadAction<Birth[]>) => {
      state.births = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchBirthsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    setSelectedBirth: (state, action: PayloadAction<Birth | null>) => {
      state.selectedBirth = action.payload;
    },
    addBirth: (state, action: PayloadAction<Birth>) => {
      state.births.unshift(action.payload);
      // Update related pregnancy record
      const pregnancy = state.pregnancies.find(p => p.id === action.payload.pregnancyId);
      if (pregnancy) {
        pregnancy.status = PregnancyStatus.Completed;
        pregnancy.actualBirthDate = action.payload.birthDate;
      }
    },
    updateBirth: (state, action: PayloadAction<Birth>) => {
      const index = state.births.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.births[index] = action.payload;
      }
      if (state.selectedBirth?.id === action.payload.id) {
        state.selectedBirth = action.payload;
      }
    },
    deleteBirth: (state, action: PayloadAction<string>) => {
      const birth = state.births.find(b => b.id === action.payload);
      if (birth) {
        // Reset related pregnancy record
        const pregnancy = state.pregnancies.find(p => p.id === birth.pregnancyId);
        if (pregnancy) {
          pregnancy.status = PregnancyStatus.Confirmed;
          pregnancy.actualBirthDate = undefined;
        }
      }
      state.births = state.births.filter(b => b.id !== action.payload);
      if (state.selectedBirth?.id === action.payload) {
        state.selectedBirth = null;
      }
    },

    // Lineage Records
    fetchLineageRecordsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchLineageRecordsSuccess: (state, action: PayloadAction<LineageRecord[]>) => {
      state.lineageRecords = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchLineageRecordsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    addLineageRecord: (state, action: PayloadAction<LineageRecord>) => {
      state.lineageRecords.push(action.payload);
    },
    updateLineageRecord: (state, action: PayloadAction<LineageRecord>) => {
      const index = state.lineageRecords.findIndex(l => l.id === action.payload.id);
      if (index !== -1) {
        state.lineageRecords[index] = action.payload;
      }
    },

    // Genetic Profiles
    fetchGeneticProfilesStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchGeneticProfilesSuccess: (state, action: PayloadAction<GeneticProfile[]>) => {
      state.geneticProfiles = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchGeneticProfilesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    addGeneticProfile: (state, action: PayloadAction<GeneticProfile>) => {
      state.geneticProfiles.push(action.payload);
    },
    updateGeneticProfile: (state, action: PayloadAction<GeneticProfile>) => {
      const index = state.geneticProfiles.findIndex(g => g.id === action.payload.id);
      if (index !== -1) {
        state.geneticProfiles[index] = action.payload;
      }
    },

    // Filters
    setBreedingFilters: (state, action: PayloadAction<Partial<BreedingFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearBreedingFilters: (state) => {
      state.filters = {};
    },
    setPregnancyFilters: (state, action: PayloadAction<Partial<PregnancyFilters>>) => {
      state.pregnancyFilters = { ...state.pregnancyFilters, ...action.payload };
    },
    clearPregnancyFilters: (state) => {
      state.pregnancyFilters = {};
    },

    // Offline Mode
    setOfflineMode: (state, action: PayloadAction<boolean>) => {
      state.isOffline = action.payload;
    },

    // Error Handling
    clearBreedingError: (state) => {
      state.error = null;
    },
  },
});

export const {
  // Breeding Records
  fetchBreedingsStart,
  fetchBreedingsSuccess,
  fetchBreedingsFailure,
  setSelectedBreeding,
  addBreeding,
  updateBreeding,
  deleteBreeding,

  // Pregnancy Records
  fetchPregnanciesStart,
  fetchPregnanciesSuccess,
  fetchPregnanciesFailure,
  setSelectedPregnancy,
  addPregnancy,
  updatePregnancy,
  deletePregnancy,

  // Birth Records
  fetchBirthsStart,
  fetchBirthsSuccess,
  fetchBirthsFailure,
  setSelectedBirth,
  addBirth,
  updateBirth,
  deleteBirth,

  // Lineage Records
  fetchLineageRecordsStart,
  fetchLineageRecordsSuccess,
  fetchLineageRecordsFailure,
  addLineageRecord,
  updateLineageRecord,

  // Genetic Profiles
  fetchGeneticProfilesStart,
  fetchGeneticProfilesSuccess,
  fetchGeneticProfilesFailure,
  addGeneticProfile,
  updateGeneticProfile,

  // Filters
  setBreedingFilters,
  clearBreedingFilters,
  setPregnancyFilters,
  clearPregnancyFilters,

  // Offline Mode
  setOfflineMode,

  // Error Handling
  clearBreedingError,
} = breedingSlice.actions;

export default breedingSlice.reducer; 