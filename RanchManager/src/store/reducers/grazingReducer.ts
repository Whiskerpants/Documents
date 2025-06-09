import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  GrazingState,
  Pasture,
  WaterSource,
  GrazingEvent,
  ForageMeasurement,
  SoilSample,
  GrazingPlan,
  WeatherData,
  CarbonSequestration,
  SoilHealthScore,
  EconomicImpact,
  PastureStatus
} from '../types/grazing';
import { fetchPastures, fetchGrazingEvents, addPasture, updatePasture, addGrazingEvent, updateGrazingEvent } from '../actions/grazingActions';

// Initial state
const initialState: GrazingState = {
  pastures: {
    items: [],
    loading: false,
    error: null
  },
  waterSources: {
    items: [],
    loading: false,
    error: null
  },
  grazingEvents: {
    items: [],
    loading: false,
    error: null
  },
  forageMeasurements: {
    items: [],
    loading: false,
    error: null
  },
  soilSamples: {
    items: [],
    loading: false,
    error: null
  },
  grazingPlans: {
    items: [],
    loading: false,
    error: null
  },
  weatherData: {
    items: [],
    loading: false,
    error: null
  },
  carbonSequestration: {
    items: [],
    loading: false,
    error: null
  },
  soilHealthScores: {
    items: [],
    loading: false,
    error: null
  },
  economicImpacts: {
    items: [],
    loading: false,
    error: null
  },
  currentPlan: null,
  offlineMode: false,
  loading: {
    pastures: false,
    events: false,
    plan: false,
  },
  error: {
    pastures: null,
    events: null,
    plan: null,
  },
};

// Helper function to handle loading and error states
const setLoading = (state: GrazingState, entity: keyof GrazingState, loading: boolean) => {
  state[entity].loading = loading;
  if (loading) {
    state[entity].error = null;
  }
};

const setError = (state: GrazingState, entity: keyof GrazingState, error: string) => {
  state[entity].loading = false;
  state[entity].error = error;
};

// Create the slice
const grazingSlice = createSlice({
  name: 'grazing',
  initialState,
  reducers: {
    // Pasture operations
    setPastures: (state, action: PayloadAction<Pasture[]>) => {
      state.pastures.items = action.payload;
      state.pastures.loading = false;
      state.pastures.error = null;
    },
    addPasture: (state, action: PayloadAction<Pasture>) => {
      state.pastures.items.push(action.payload);
    },
    updatePasture: (state, action: PayloadAction<Pasture>) => {
      const index = state.pastures.items.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.pastures.items[index] = action.payload;
      }
    },
    deletePasture: (state, action: PayloadAction<string>) => {
      state.pastures.items = state.pastures.items.filter(p => p.id !== action.payload);
    },
    setPasturesLoading: (state, action: PayloadAction<boolean>) => {
      setLoading(state, 'pastures', action.payload);
    },
    setPasturesError: (state, action: PayloadAction<string>) => {
      setError(state, 'pastures', action.payload);
    },

    // Water source operations
    setWaterSources: (state, action: PayloadAction<WaterSource[]>) => {
      state.waterSources.items = action.payload;
      state.waterSources.loading = false;
      state.waterSources.error = null;
    },
    addWaterSource: (state, action: PayloadAction<WaterSource>) => {
      state.waterSources.items.push(action.payload);
    },
    updateWaterSource: (state, action: PayloadAction<WaterSource>) => {
      const index = state.waterSources.items.findIndex(w => w.id === action.payload.id);
      if (index !== -1) {
        state.waterSources.items[index] = action.payload;
      }
    },
    deleteWaterSource: (state, action: PayloadAction<string>) => {
      state.waterSources.items = state.waterSources.items.filter(w => w.id !== action.payload);
    },
    setWaterSourcesLoading: (state, action: PayloadAction<boolean>) => {
      setLoading(state, 'waterSources', action.payload);
    },
    setWaterSourcesError: (state, action: PayloadAction<string>) => {
      setError(state, 'waterSources', action.payload);
    },

    // Grazing event operations
    setGrazingEvents: (state, action: PayloadAction<GrazingEvent[]>) => {
      state.grazingEvents.items = action.payload;
      state.grazingEvents.loading = false;
      state.grazingEvents.error = null;
    },
    addGrazingEvent: (state, action: PayloadAction<GrazingEvent>) => {
      state.grazingEvents.items.push(action.payload);
    },
    updateGrazingEvent: (state, action: PayloadAction<GrazingEvent>) => {
      const index = state.grazingEvents.items.findIndex(e => e.id === action.payload.id);
      if (index !== -1) {
        state.grazingEvents.items[index] = action.payload;
      }
    },
    deleteGrazingEvent: (state, action: PayloadAction<string>) => {
      state.grazingEvents.items = state.grazingEvents.items.filter(e => e.id !== action.payload);
    },
    setGrazingEventsLoading: (state, action: PayloadAction<boolean>) => {
      setLoading(state, 'grazingEvents', action.payload);
    },
    setGrazingEventsError: (state, action: PayloadAction<string>) => {
      setError(state, 'grazingEvents', action.payload);
    },

    // Forage measurement operations
    setForageMeasurements: (state, action: PayloadAction<ForageMeasurement[]>) => {
      state.forageMeasurements.items = action.payload;
      state.forageMeasurements.loading = false;
      state.forageMeasurements.error = null;
    },
    addForageMeasurement: (state, action: PayloadAction<ForageMeasurement>) => {
      state.forageMeasurements.items.push(action.payload);
    },
    updateForageMeasurement: (state, action: PayloadAction<ForageMeasurement>) => {
      const index = state.forageMeasurements.items.findIndex(m => m.id === action.payload.id);
      if (index !== -1) {
        state.forageMeasurements.items[index] = action.payload;
      }
    },
    deleteForageMeasurement: (state, action: PayloadAction<string>) => {
      state.forageMeasurements.items = state.forageMeasurements.items.filter(m => m.id !== action.payload);
    },
    setForageMeasurementsLoading: (state, action: PayloadAction<boolean>) => {
      setLoading(state, 'forageMeasurements', action.payload);
    },
    setForageMeasurementsError: (state, action: PayloadAction<string>) => {
      setError(state, 'forageMeasurements', action.payload);
    },

    // Soil sample operations
    setSoilSamples: (state, action: PayloadAction<SoilSample[]>) => {
      state.soilSamples.items = action.payload;
      state.soilSamples.loading = false;
      state.soilSamples.error = null;
    },
    addSoilSample: (state, action: PayloadAction<SoilSample>) => {
      state.soilSamples.items.push(action.payload);
    },
    updateSoilSample: (state, action: PayloadAction<SoilSample>) => {
      const index = state.soilSamples.items.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.soilSamples.items[index] = action.payload;
      }
    },
    deleteSoilSample: (state, action: PayloadAction<string>) => {
      state.soilSamples.items = state.soilSamples.items.filter(s => s.id !== action.payload);
    },
    setSoilSamplesLoading: (state, action: PayloadAction<boolean>) => {
      setLoading(state, 'soilSamples', action.payload);
    },
    setSoilSamplesError: (state, action: PayloadAction<string>) => {
      setError(state, 'soilSamples', action.payload);
    },

    // Grazing plan operations
    setGrazingPlans: (state, action: PayloadAction<GrazingPlan[]>) => {
      state.grazingPlans.items = action.payload;
      state.grazingPlans.loading = false;
      state.grazingPlans.error = null;
    },
    addGrazingPlan: (state, action: PayloadAction<GrazingPlan>) => {
      state.grazingPlans.items.push(action.payload);
    },
    updateGrazingPlan: (state, action: PayloadAction<GrazingPlan>) => {
      const index = state.grazingPlans.items.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.grazingPlans.items[index] = action.payload;
      }
    },
    deleteGrazingPlan: (state, action: PayloadAction<string>) => {
      state.grazingPlans.items = state.grazingPlans.items.filter(p => p.id !== action.payload);
    },
    setGrazingPlansLoading: (state, action: PayloadAction<boolean>) => {
      setLoading(state, 'grazingPlans', action.payload);
    },
    setGrazingPlansError: (state, action: PayloadAction<string>) => {
      setError(state, 'grazingPlans', action.payload);
    },

    // Weather data operations
    setWeatherData: (state, action: PayloadAction<WeatherData[]>) => {
      state.weatherData.items = action.payload;
      state.weatherData.loading = false;
      state.weatherData.error = null;
    },
    addWeatherData: (state, action: PayloadAction<WeatherData>) => {
      state.weatherData.items.push(action.payload);
    },
    updateWeatherData: (state, action: PayloadAction<WeatherData>) => {
      const index = state.weatherData.items.findIndex(w => w.id === action.payload.id);
      if (index !== -1) {
        state.weatherData.items[index] = action.payload;
      }
    },
    deleteWeatherData: (state, action: PayloadAction<string>) => {
      state.weatherData.items = state.weatherData.items.filter(w => w.id !== action.payload);
    },
    setWeatherDataLoading: (state, action: PayloadAction<boolean>) => {
      setLoading(state, 'weatherData', action.payload);
    },
    setWeatherDataError: (state, action: PayloadAction<string>) => {
      setError(state, 'weatherData', action.payload);
    },

    // Carbon sequestration operations
    setCarbonSequestration: (state, action: PayloadAction<CarbonSequestration[]>) => {
      state.carbonSequestration.items = action.payload;
      state.carbonSequestration.loading = false;
      state.carbonSequestration.error = null;
    },
    addCarbonSequestration: (state, action: PayloadAction<CarbonSequestration>) => {
      state.carbonSequestration.items.push(action.payload);
    },
    updateCarbonSequestration: (state, action: PayloadAction<CarbonSequestration>) => {
      const index = state.carbonSequestration.items.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.carbonSequestration.items[index] = action.payload;
      }
    },
    deleteCarbonSequestration: (state, action: PayloadAction<string>) => {
      state.carbonSequestration.items = state.carbonSequestration.items.filter(c => c.id !== action.payload);
    },
    setCarbonSequestrationLoading: (state, action: PayloadAction<boolean>) => {
      setLoading(state, 'carbonSequestration', action.payload);
    },
    setCarbonSequestrationError: (state, action: PayloadAction<string>) => {
      setError(state, 'carbonSequestration', action.payload);
    },

    // Soil health score operations
    setSoilHealthScores: (state, action: PayloadAction<SoilHealthScore[]>) => {
      state.soilHealthScores.items = action.payload;
      state.soilHealthScores.loading = false;
      state.soilHealthScores.error = null;
    },
    addSoilHealthScore: (state, action: PayloadAction<SoilHealthScore>) => {
      state.soilHealthScores.items.push(action.payload);
    },
    updateSoilHealthScore: (state, action: PayloadAction<SoilHealthScore>) => {
      const index = state.soilHealthScores.items.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.soilHealthScores.items[index] = action.payload;
      }
    },
    deleteSoilHealthScore: (state, action: PayloadAction<string>) => {
      state.soilHealthScores.items = state.soilHealthScores.items.filter(s => s.id !== action.payload);
    },
    setSoilHealthScoresLoading: (state, action: PayloadAction<boolean>) => {
      setLoading(state, 'soilHealthScores', action.payload);
    },
    setSoilHealthScoresError: (state, action: PayloadAction<string>) => {
      setError(state, 'soilHealthScores', action.payload);
    },

    // Economic impact operations
    setEconomicImpacts: (state, action: PayloadAction<EconomicImpact[]>) => {
      state.economicImpacts.items = action.payload;
      state.economicImpacts.loading = false;
      state.economicImpacts.error = null;
    },
    addEconomicImpact: (state, action: PayloadAction<EconomicImpact>) => {
      state.economicImpacts.items.push(action.payload);
    },
    updateEconomicImpact: (state, action: PayloadAction<EconomicImpact>) => {
      const index = state.economicImpacts.items.findIndex(e => e.id === action.payload.id);
      if (index !== -1) {
        state.economicImpacts.items[index] = action.payload;
      }
    },
    deleteEconomicImpact: (state, action: PayloadAction<string>) => {
      state.economicImpacts.items = state.economicImpacts.items.filter(e => e.id !== action.payload);
    },
    setEconomicImpactsLoading: (state, action: PayloadAction<boolean>) => {
      setLoading(state, 'economicImpacts', action.payload);
    },
    setEconomicImpactsError: (state, action: PayloadAction<string>) => {
      setError(state, 'economicImpacts', action.payload);
    },

    // Specialized operations
    updatePastureStatus: (state, action: PayloadAction<{ id: string; status: PastureStatus }>) => {
      const pasture = state.pastures.items.find(p => p.id === action.payload.id);
      if (pasture) {
        pasture.status = action.payload.status;
      }
    },
    clearAllData: (state) => {
      Object.keys(state).forEach(key => {
        const entity = key as keyof GrazingState;
        state[entity].items = [];
        state[entity].loading = false;
        state[entity].error = null;
      });
    },
    setOfflineMode: (state, action: PayloadAction<boolean>) => {
      state.offlineMode = action.payload;
    },
    setCurrentPlan: (state, action: PayloadAction<GrazingPlan | null>) => {
      state.currentPlan = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Fetch pastures
    builder
      .addCase(fetchPastures.pending, (state) => {
        state.loading.pastures = true;
        state.error.pastures = null;
      })
      .addCase(fetchPastures.fulfilled, (state, action: PayloadAction<Pasture[]>) => {
        state.loading.pastures = false;
        state.pastures.items = action.payload;
      })
      .addCase(fetchPastures.rejected, (state, action) => {
        state.loading.pastures = false;
        state.error.pastures = action.error.message || 'Failed to fetch pastures';
      });

    // Fetch grazing events
    builder
      .addCase(fetchGrazingEvents.pending, (state) => {
        state.loading.events = true;
        state.error.events = null;
      })
      .addCase(fetchGrazingEvents.fulfilled, (state, action: PayloadAction<GrazingEvent[]>) => {
        state.loading.events = false;
        state.grazingEvents.items = action.payload;
      })
      .addCase(fetchGrazingEvents.rejected, (state, action) => {
        state.loading.events = false;
        state.error.events = action.error.message || 'Failed to fetch grazing events';
      });

    // Add pasture
    builder
      .addCase(addPasture.fulfilled, (state, action: PayloadAction<Pasture>) => {
        state.pastures.items.push(action.payload);
      });

    // Update pasture
    builder
      .addCase(updatePasture.fulfilled, (state, action: PayloadAction<Pasture>) => {
        const index = state.pastures.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.pastures.items[index] = action.payload;
        }
      });

    // Add grazing event
    builder
      .addCase(addGrazingEvent.fulfilled, (state, action: PayloadAction<GrazingEvent>) => {
        state.grazingEvents.items.push(action.payload);
      });

    // Update grazing event
    builder
      .addCase(updateGrazingEvent.fulfilled, (state, action: PayloadAction<GrazingEvent>) => {
        const index = state.grazingEvents.items.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.grazingEvents.items[index] = action.payload;
        }
      });
  }
});

// Export actions and reducer
export const {
  // Pasture actions
  setPastures,
  addPasture,
  updatePasture,
  deletePasture,
  setPasturesLoading,
  setPasturesError,
  updatePastureStatus,

  // Water source actions
  setWaterSources,
  addWaterSource,
  updateWaterSource,
  deleteWaterSource,
  setWaterSourcesLoading,
  setWaterSourcesError,

  // Grazing event actions
  setGrazingEvents,
  addGrazingEvent,
  updateGrazingEvent,
  deleteGrazingEvent,
  setGrazingEventsLoading,
  setGrazingEventsError,

  // Forage measurement actions
  setForageMeasurements,
  addForageMeasurement,
  updateForageMeasurement,
  deleteForageMeasurement,
  setForageMeasurementsLoading,
  setForageMeasurementsError,

  // Soil sample actions
  setSoilSamples,
  addSoilSample,
  updateSoilSample,
  deleteSoilSample,
  setSoilSamplesLoading,
  setSoilSamplesError,

  // Grazing plan actions
  setGrazingPlans,
  addGrazingPlan,
  updateGrazingPlan,
  deleteGrazingPlan,
  setGrazingPlansLoading,
  setGrazingPlansError,

  // Weather data actions
  setWeatherData,
  addWeatherData,
  updateWeatherData,
  deleteWeatherData,
  setWeatherDataLoading,
  setWeatherDataError,

  // Carbon sequestration actions
  setCarbonSequestration,
  addCarbonSequestration,
  updateCarbonSequestration,
  deleteCarbonSequestration,
  setCarbonSequestrationLoading,
  setCarbonSequestrationError,

  // Soil health score actions
  setSoilHealthScores,
  addSoilHealthScore,
  updateSoilHealthScore,
  deleteSoilHealthScore,
  setSoilHealthScoresLoading,
  setSoilHealthScoresError,

  // Economic impact actions
  setEconomicImpacts,
  addEconomicImpact,
  updateEconomicImpact,
  deleteEconomicImpact,
  setEconomicImpactsLoading,
  setEconomicImpactsError,

  // Utility actions
  clearAllData,
  setOfflineMode,
  setCurrentPlan
} = grazingSlice.actions;

export default grazingSlice.reducer; 