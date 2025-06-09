import { configureStore } from '@reduxjs/toolkit';
import financialReducer from './reducers/financialReducer';
import grazingReducer from './reducers/grazingReducer';
import breedingReducer from './reducers/breedingReducer';
import healthReducer from './reducers/healthReducer';
import dashboardReducer from './reducers/dashboardReducer';
import cattleReducer from './reducers/cattleReducer';
import networkReducer from './reducers/networkReducer';

export const store = configureStore({
  reducer: {
    financial: financialReducer,
    grazing: grazingReducer,
    breeding: breedingReducer,
    health: healthReducer,
    dashboard: dashboardReducer,
    cattle: cattleReducer,
    network: networkReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store; 