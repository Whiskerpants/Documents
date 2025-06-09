import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NetworkState } from '../types/network';

const initialState: NetworkState = {
  isOffline: false,
  lastSync: null,
  error: null,
};

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setOfflineMode: (state, action: PayloadAction<boolean>) => {
      state.isOffline = action.payload;
    },
    setLastSync: (state, action: PayloadAction<Date>) => {
      state.lastSync = action.payload;
    },
    setNetworkError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setOfflineMode,
  setLastSync,
  setNetworkError,
} = networkSlice.actions;

export default networkSlice.reducer; 