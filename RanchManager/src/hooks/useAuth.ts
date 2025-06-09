import { useState, useEffect } from 'react';
import { AuthService } from '../services/AuthService';
import { User, AuthState } from '../store/types/auth';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const authService = AuthService.getInstance();

    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthStateChanged((state: AuthState) => {
      setAuthState(state);
    });

    // Check initial auth state
    authService.getCurrentUser().then((user) => {
      setAuthState({
        user,
        isAuthenticated: !!user,
        isLoading: false,
        error: null,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return authState;
}; 