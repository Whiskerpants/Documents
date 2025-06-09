export interface NetworkState {
  isOffline: boolean;
  lastSync: Date | null;
  error: string | null;
} 