import { configureStore } from '@reduxjs/toolkit';
import grazingReducer from './reducers/grazingReducer';
import authReducer from './reducers/authReducer';

export const store = configureStore({
  reducer: {
    grazing: grazingReducer,
    auth: authReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 