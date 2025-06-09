export type UserRole = 'owner' | 'manager' | 'worker';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isEmailVerified: boolean;
  isMFAEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  language: string;
  timezone: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
  loading: boolean;
  error: string | null;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public code: AuthErrorCode,
    public details?: any
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'USER_EXISTS'
  | 'USER_NOT_FOUND'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'INVALID_PASSWORD'
  | 'INVALID_EMAIL'
  | 'INVALID_INPUT'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'MFA_REQUIRED'
  | 'INVALID_MFA_CODE'
  | 'EMAIL_VERIFICATION_REQUIRED'
  | 'ACCOUNT_LOCKED'
  | 'RATE_LIMIT_EXCEEDED';

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  timestamp: Date;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
  lastActivityAt: Date;
  deviceInfo?: {
    platform: string;
    model: string;
    osVersion: string;
  };
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  roles: UserRole[];
}

export interface Role {
  name: UserRole;
  description: string;
  permissions: string[];
  isDefault: boolean;
  canBeAssigned: boolean;
} 