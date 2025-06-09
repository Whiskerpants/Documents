import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DashboardState, DashboardMetrics, HealthAlert, Activity } from '../types/dashboard';

const initialState: DashboardState = {
  metrics: {
    totalCattle: 0,
    activeCattle: 0,
    sickCattle: 0,
    underObservation: 0,
    totalWeight: 0,
    averageWeight: 0,
    lastUpdated: new Date(),
  },
  healthAlerts: [],
  recentActivities: [],
  loading: false,
  error: null,
  lastSync: null,
  isOffline: false,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    fetchDashboardStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchDashboardSuccess: (state, action: PayloadAction<{
      metrics: DashboardMetrics;
      healthAlerts: HealthAlert[];
      recentActivities: Activity[];
    }>) => {
      state.metrics = action.payload.metrics;
      state.healthAlerts = action.payload.healthAlerts;
      state.recentActivities = action.payload.recentActivities;
      state.loading = false;
      state.error = null;
      state.lastSync = new Date();
    },
    fetchDashboardFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    setOfflineMode: (state, action: PayloadAction<boolean>) => {
      state.isOffline = action.payload;
    },
    addHealthAlert: (state, action: PayloadAction<HealthAlert>) => {
      state.healthAlerts.unshift(action.payload);
    },
    updateHealthAlert: (state, action: PayloadAction<HealthAlert>) => {
      const index = state.healthAlerts.findIndex(alert => alert.id === action.payload.id);
      if (index !== -1) {
        state.healthAlerts[index] = action.payload;
      }
    },
    addActivity: (state, action: PayloadAction<Activity>) => {
      state.recentActivities.unshift(action.payload);
      // Keep only the last 50 activities
      if (state.recentActivities.length > 50) {
        state.recentActivities.pop();
      }
    },
    updateMetrics: (state, action: PayloadAction<Partial<DashboardMetrics>>) => {
      state.metrics = { ...state.metrics, ...action.payload };
      state.metrics.lastUpdated = new Date();
    },
    clearDashboardError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchDashboardStart,
  fetchDashboardSuccess,
  fetchDashboardFailure,
  setOfflineMode,
  addHealthAlert,
  updateHealthAlert,
  addActivity,
  updateMetrics,
  clearDashboardError,
} = dashboardSlice.actions;

export default dashboardSlice.reducer; 