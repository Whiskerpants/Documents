import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { EventEmitter } from 'events';
import { User, UserRole, AuthState, AuthError, AuthErrorCode } from '../store/types/auth';
import { PerformanceService } from './performanceService';

export class AuthService {
  private static instance: AuthService;
  private eventEmitter: EventEmitter;
  private perfService: PerformanceService;
  private currentUser: User | null = null;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'current_user';

  private constructor() {
    this.eventEmitter = new EventEmitter();
    this.perfService = PerformanceService.getInstance();
    this.initialize();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async initialize() {
    try {
      const [token, user] = await Promise.all([
        this.getStoredToken(),
        this.getStoredUser(),
      ]);

      if (token && user) {
        this.currentUser = user;
        this.eventEmitter.emit('authStateChanged', { user, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Error initializing auth service:', error);
    }
  }

  // Authentication Methods
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  }): Promise<User> {
    return this.perfService.measureAsync('user_registration', async () => {
      try {
        // Validate input
        this.validateRegistrationData(userData);

        // Check if user already exists
        const existingUser = await this.findUserByEmail(userData.email);
        if (existingUser) {
          throw new AuthError('User already exists', 'USER_EXISTS');
        }

        // Create user
        const user: User = {
          id: this.generateUserId(),
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          isEmailVerified: false,
          isMFAEnabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Hash password and store user
        await this.storeUser(user, userData.password);

        // Send verification email
        await this.sendVerificationEmail(user);

        return user;
      } catch (error) {
        console.error('Error registering user:', error);
        throw error;
      }
    });
  }

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<{ user: User; token: string }> {
    return this.perfService.measureAsync('user_login', async () => {
      try {
        // Validate credentials
        const user = await this.validateCredentials(credentials);
        if (!user) {
          throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS');
        }

        // Check MFA if enabled
        if (user.isMFAEnabled) {
          const mfaVerified = await this.verifyMFA(user);
          if (!mfaVerified) {
            throw new AuthError('MFA verification failed', 'MFA_REQUIRED');
          }
        }

        // Generate tokens
        const { token, refreshToken } = await this.generateTokens(user);

        // Store tokens and update current user
        await this.storeTokens(token, refreshToken);
        this.currentUser = user;

        // Emit auth state change
        this.eventEmitter.emit('authStateChanged', {
          user,
          isAuthenticated: true,
        });

        return { user, token };
      } catch (error) {
        console.error('Error logging in:', error);
        throw error;
      }
    });
  }

  async logout(): Promise<void> {
    try {
      // Clear stored data
      await Promise.all([
        SecureStore.deleteItemAsync(this.TOKEN_KEY),
        SecureStore.deleteItemAsync(this.REFRESH_TOKEN_KEY),
        SecureStore.deleteItemAsync(this.USER_KEY),
      ]);

      // Update state
      this.currentUser = null;

      // Emit auth state change
      this.eventEmitter.emit('authStateChanged', {
        user: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }

  // Password Management
  async resetPassword(email: string): Promise<void> {
    try {
      const user = await this.findUserByEmail(email);
      if (!user) {
        throw new AuthError('User not found', 'USER_NOT_FOUND');
      }

      // Generate reset token
      const resetToken = this.generateResetToken();

      // Store reset token
      await this.storeResetToken(user.id, resetToken);

      // Send reset email
      await this.sendPasswordResetEmail(user, resetToken);
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }

  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      // Verify current password
      const isValid = await this.verifyPassword(userId, currentPassword);
      if (!isValid) {
        throw new AuthError('Current password is incorrect', 'INVALID_PASSWORD');
      }

      // Update password
      await this.storeUserPassword(userId, newPassword);

      // Invalidate all sessions
      await this.invalidateUserSessions(userId);
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  // Email Verification
  async sendVerificationEmail(user: User): Promise<void> {
    try {
      const verificationToken = this.generateVerificationToken();
      await this.storeVerificationToken(user.id, verificationToken);
      // Implement email sending logic
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      const userId = await this.validateVerificationToken(token);
      if (!userId) {
        throw new AuthError('Invalid verification token', 'INVALID_TOKEN');
      }

      await this.updateUser(userId, { isEmailVerified: true });
    } catch (error) {
      console.error('Error verifying email:', error);
      throw error;
    }
  }

  // MFA Management
  async enableMFA(userId: string): Promise<{ secret: string; qrCode: string }> {
    try {
      const secret = this.generateMFASecret();
      const qrCode = this.generateMFAQRCode(userId, secret);
      
      await this.storeMFASecret(userId, secret);
      await this.updateUser(userId, { isMFAEnabled: true });
      
      return { secret, qrCode };
    } catch (error) {
      console.error('Error enabling MFA:', error);
      throw error;
    }
  }

  async disableMFA(userId: string, code: string): Promise<void> {
    try {
      const isValid = await this.verifyMFACode(userId, code);
      if (!isValid) {
        throw new AuthError('Invalid MFA code', 'INVALID_MFA_CODE');
      }

      await this.updateUser(userId, { isMFAEnabled: false });
      await this.removeMFASecret(userId);
    } catch (error) {
      console.error('Error disabling MFA:', error);
      throw error;
    }
  }

  // User Management
  async updateUser(
    userId: string,
    updates: Partial<User>
  ): Promise<User> {
    try {
      const user = await this.findUserById(userId);
      if (!user) {
        throw new AuthError('User not found', 'USER_NOT_FOUND');
      }

      const updatedUser = {
        ...user,
        ...updates,
        updatedAt: new Date(),
      };

      await this.storeUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async updateUserRole(
    userId: string,
    newRole: UserRole,
    updatedBy: string
  ): Promise<User> {
    try {
      // Verify updater has permission
      const updater = await this.findUserById(updatedBy);
      if (!updater || !this.canManageRoles(updater.role)) {
        throw new AuthError('Insufficient permissions', 'INSUFFICIENT_PERMISSIONS');
      }

      return this.updateUser(userId, { role: newRole });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  // Role-based Access Control
  canAccessFeature(user: User, feature: string): boolean {
    // Implement feature access control logic based on user role
    switch (feature) {
      case 'financial_reports':
        return user.role === 'owner' || user.role === 'manager';
      case 'user_management':
        return user.role === 'owner';
      case 'inventory_management':
        return user.role === 'owner' || user.role === 'manager';
      case 'basic_operations':
        return true; // All roles can access basic operations
      default:
        return false;
    }
  }

  canManageRoles(role: UserRole): boolean {
    return role === 'owner' || role === 'manager';
  }

  // Event Handling
  onAuthStateChanged(callback: (state: AuthState) => void): () => void {
    this.eventEmitter.on('authStateChanged', callback);
    return () => {
      this.eventEmitter.off('authStateChanged', callback);
    };
  }

  onUserUpdated(callback: (user: User) => void): void {
    this.eventEmitter.on('userUpdated', callback);
  }

  // Helper Methods
  private async getStoredToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  private async getStoredUser(): Promise<User | null> {
    try {
      const userData = await SecureStore.getItemAsync(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }

  private async storeTokens(
    token: string,
    refreshToken: string
  ): Promise<void> {
    try {
      await Promise.all([
        SecureStore.setItemAsync(this.TOKEN_KEY, token),
        SecureStore.setItemAsync(this.REFRESH_TOKEN_KEY, refreshToken),
      ]);
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw error;
    }
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateResetToken(): string {
    return `reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateVerificationToken(): string {
    return `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMFASecret(): string {
    // Implement MFA secret generation
    return '';
  }

  private generateMFAQRCode(userId: string, secret: string): string {
    // Implement QR code generation
    return '';
  }

  private validateRegistrationData(data: any): void {
    if (!data.email || !data.password || !data.firstName || !data.lastName) {
      throw new AuthError('Missing required fields', 'INVALID_INPUT');
    }

    if (!this.isValidEmail(data.email)) {
      throw new AuthError('Invalid email format', 'INVALID_EMAIL');
    }

    if (!this.isValidPassword(data.password)) {
      throw new AuthError(
        'Password must be at least 8 characters long and contain letters and numbers',
        'INVALID_PASSWORD'
      );
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPassword(password: string): boolean {
    return password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
  }

  private getRolePermissions(role: UserRole): string[] {
    const permissions: Record<UserRole, string[]> = {
      owner: ['*'],
      manager: [
        'view_financials',
        'edit_financials',
        'manage_users',
        'view_reports',
        'generate_reports',
      ],
      worker: ['view_financials', 'view_reports'],
    };

    return permissions[role] || [];
  }

  // These methods would typically interact with a backend service
  private async findUserByEmail(email: string): Promise<User | null> {
    // Implement user lookup
    return null;
  }

  private async findUserById(id: string): Promise<User | null> {
    // Implement user lookup
    return null;
  }

  private async storeUser(user: User, password?: string): Promise<void> {
    // Implement user storage
  }

  private async storeUserPassword(userId: string, password: string): Promise<void> {
    // Implement password storage
  }

  private async validateCredentials(credentials: {
    email: string;
    password: string;
  }): Promise<User | null> {
    // Implement credential validation
    return null;
  }

  private async verifyPassword(userId: string, password: string): Promise<boolean> {
    // Implement password verification
    return false;
  }

  private async generateTokens(user: User): Promise<{
    token: string;
    refreshToken: string;
  }> {
    // Implement token generation
    return { token: '', refreshToken: '' };
  }

  private async verifyMFA(user: User): Promise<boolean> {
    // Implement MFA verification
    return false;
  }

  private async verifyMFACode(userId: string, code: string): Promise<boolean> {
    // Implement MFA code verification
    return false;
  }

  private async storeMFASecret(userId: string, secret: string): Promise<void> {
    // Implement MFA secret storage
  }

  private async removeMFASecret(userId: string): Promise<void> {
    // Implement MFA secret removal
  }

  private async storeResetToken(userId: string, token: string): Promise<void> {
    // Implement reset token storage
  }

  private async storeVerificationToken(userId: string, token: string): Promise<void> {
    // Implement verification token storage
  }

  private async validateVerificationToken(token: string): Promise<string | null> {
    // Implement verification token validation
    return null;
  }

  private async invalidateUserSessions(userId: string): Promise<void> {
    // Implement session invalidation
  }

  private async sendPasswordResetEmail(user: User, token: string): Promise<void> {
    // Implement password reset email sending
  }

  public async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    try {
      const userJson = await SecureStore.getItemAsync('user');
      if (userJson) {
        this.currentUser = JSON.parse(userJson);
        return this.currentUser;
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }

    return null;
  }
} 