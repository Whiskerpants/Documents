import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { EventEmitter } from 'events';
import { AuthService } from './AuthService';
import { PerformanceService } from './performanceService';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationCategory = 
  | 'financial'
  | 'inventory'
  | 'health'
  | 'maintenance'
  | 'security'
  | 'system'
  | 'custom';

export interface NotificationPreferences {
  push: {
    enabled: boolean;
    categories: Record<NotificationCategory, boolean>;
    priority: NotificationPriority;
  };
  email: {
    enabled: boolean;
    categories: Record<NotificationCategory, boolean>;
    priority: NotificationPriority;
    address?: string;
  };
  inApp: {
    enabled: boolean;
    categories: Record<NotificationCategory, boolean>;
    priority: NotificationPriority;
    sound: boolean;
    vibration: boolean;
  };
  scheduled: {
    enabled: boolean;
    reminders: {
      healthChecks: boolean;
      budgetReviews: boolean;
      inventoryAudits: boolean;
      maintenance: boolean;
    };
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string; // HH:mm format
  };
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  category: NotificationCategory;
  priority: NotificationPriority;
  timestamp: Date;
  read: boolean;
  action?: {
    type: string;
    payload: any;
  };
  groupId?: string;
}

export interface NotificationGroup {
  id: string;
  category: NotificationCategory;
  notifications: Notification[];
  unreadCount: number;
  lastUpdated: Date;
}

export class NotificationService {
  private static instance: NotificationService;
  private eventEmitter: EventEmitter;
  private authService: AuthService;
  private perfService: PerformanceService;
  private preferences: NotificationPreferences;
  private readonly PREFERENCES_KEY = 'notification_preferences';
  private readonly NOTIFICATIONS_KEY = 'notifications';
  private readonly GROUPS_KEY = 'notification_groups';

  private constructor() {
    this.eventEmitter = new EventEmitter();
    this.authService = AuthService.getInstance();
    this.perfService = PerformanceService.getInstance();
    this.preferences = this.getDefaultPreferences();
    this.initialize();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private getDefaultPreferences(): NotificationPreferences {
    return {
      push: {
        enabled: true,
        categories: {
          financial: true,
          inventory: true,
          health: true,
          maintenance: true,
          security: true,
          system: true,
          custom: true,
        },
        priority: 'medium',
      },
      email: {
        enabled: false,
        categories: {
          financial: true,
          inventory: false,
          health: true,
          maintenance: false,
          security: true,
          system: false,
          custom: false,
        },
        priority: 'high',
      },
      inApp: {
        enabled: true,
        categories: {
          financial: true,
          inventory: true,
          health: true,
          maintenance: true,
          security: true,
          system: true,
          custom: true,
        },
        priority: 'medium',
        sound: true,
        vibration: true,
      },
      scheduled: {
        enabled: true,
        reminders: {
          healthChecks: true,
          budgetReviews: true,
          inventoryAudits: true,
          maintenance: true,
        },
        frequency: 'daily',
        time: '09:00',
      },
    };
  }

  private async initialize() {
    try {
      // Load saved preferences
      const savedPreferences = await this.loadPreferences();
      if (savedPreferences) {
        this.preferences = { ...this.preferences, ...savedPreferences };
      }

      // Request notification permissions
      if (Platform.OS !== 'web') {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.warn('Failed to get push token for push notification!');
          return;
        }

        // Configure notification handler
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: this.preferences.inApp.sound,
            shouldSetBadge: true,
          }),
        });
      }

      // Start scheduled notifications
      if (this.preferences.scheduled.enabled) {
        this.scheduleReminders();
      }
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  // Notification Creation
  async createNotification(
    title: string,
    body: string,
    category: NotificationCategory,
    priority: NotificationPriority = 'medium',
    data?: Record<string, any>,
    action?: { type: string; payload: any },
    groupId?: string
  ): Promise<Notification> {
    return this.perfService.measureAsync('notification_creation', async () => {
      const notification: Notification = {
        id: this.generateNotificationId(),
        title,
        body,
        data,
        category,
        priority,
        timestamp: new Date(),
        read: false,
        action,
        groupId,
      };

      try {
        // Store notification
        await this.storeNotification(notification);

        // Send push notification if enabled
        if (this.preferences.push.enabled && this.shouldSendPush(category, priority)) {
          await this.sendPushNotification(notification);
        }

        // Send email if enabled
        if (this.preferences.email.enabled && this.shouldSendEmail(category, priority)) {
          await this.sendEmailNotification(notification);
        }

        // Show in-app notification
        if (this.preferences.inApp.enabled && this.shouldShowInApp(category, priority)) {
          this.showInAppNotification(notification);
        }

        // Emit notification created event
        this.eventEmitter.emit('notificationCreated', notification);

        return notification;
      } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
      }
    });
  }

  // Notification Management
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const updatedNotifications = notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      await this.storeNotifications(updatedNotifications);
      this.eventEmitter.emit('notificationUpdated', { id: notificationId, read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const updatedNotifications = notifications.filter((n) => n.id !== notificationId);
      await this.storeNotifications(updatedNotifications);
      this.eventEmitter.emit('notificationDeleted', notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  async getNotifications(
    options: {
      category?: NotificationCategory;
      priority?: NotificationPriority;
      unreadOnly?: boolean;
      limit?: number;
    } = {}
  ): Promise<Notification[]> {
    try {
      const notifications = await this.loadNotifications();
      return notifications
        .filter((n) => {
          if (options.category && n.category !== options.category) return false;
          if (options.priority && n.priority !== options.priority) return false;
          if (options.unreadOnly && n.read) return false;
          return true;
        })
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, options.limit);
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  async getNotificationGroups(): Promise<NotificationGroup[]> {
    try {
      const notifications = await this.getNotifications();
      const groups: Record<string, NotificationGroup> = {};

      notifications.forEach((notification) => {
        const groupId = notification.groupId || notification.category;
        if (!groups[groupId]) {
          groups[groupId] = {
            id: groupId,
            category: notification.category,
            notifications: [],
            unreadCount: 0,
            lastUpdated: notification.timestamp,
          };
        }

        groups[groupId].notifications.push(notification);
        if (!notification.read) {
          groups[groupId].unreadCount++;
        }
        if (notification.timestamp > groups[groupId].lastUpdated) {
          groups[groupId].lastUpdated = notification.timestamp;
        }
      });

      return Object.values(groups).sort(
        (a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime()
      );
    } catch (error) {
      console.error('Error getting notification groups:', error);
      return [];
    }
  }

  // Preferences Management
  async updatePreferences(
    newPreferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      this.preferences = { ...this.preferences, ...newPreferences };
      await this.savePreferences();

      if (this.preferences.scheduled.enabled) {
        this.scheduleReminders();
      } else {
        this.cancelScheduledReminders();
      }

      this.eventEmitter.emit('preferencesUpdated', this.preferences);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  // Event Handling
  onNotificationCreated(callback: (notification: Notification) => void): () => void {
    this.eventEmitter.on('notificationCreated', callback);
    return () => {
      this.eventEmitter.off('notificationCreated', callback);
    };
  }

  onNotificationUpdated(
    callback: (update: { id: string; read: boolean }) => void
  ): () => void {
    this.eventEmitter.on('notificationUpdated', callback);
    return () => {
      this.eventEmitter.off('notificationUpdated', callback);
    };
  }

  onNotificationDeleted(callback: (notificationId: string) => void): () => void {
    this.eventEmitter.on('notificationDeleted', callback);
    return () => {
      this.eventEmitter.off('notificationDeleted', callback);
    };
  }

  onPreferencesUpdated(
    callback: (preferences: NotificationPreferences) => void
  ): () => void {
    this.eventEmitter.on('preferencesUpdated', callback);
    return () => {
      this.eventEmitter.off('preferencesUpdated', callback);
    };
  }

  // Helper Methods
  private generateNotificationId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldSendPush(
    category: NotificationCategory,
    priority: NotificationPriority
  ): boolean {
    return (
      this.preferences.push.enabled &&
      this.preferences.push.categories[category] &&
      this.getPriorityLevel(priority) >=
        this.getPriorityLevel(this.preferences.push.priority)
    );
  }

  private shouldSendEmail(
    category: NotificationCategory,
    priority: NotificationPriority
  ): boolean {
    return (
      this.preferences.email.enabled &&
      this.preferences.email.categories[category] &&
      this.getPriorityLevel(priority) >=
        this.getPriorityLevel(this.preferences.email.priority)
    );
  }

  private shouldShowInApp(
    category: NotificationCategory,
    priority: NotificationPriority
  ): boolean {
    return (
      this.preferences.inApp.enabled &&
      this.preferences.inApp.categories[category] &&
      this.getPriorityLevel(priority) >=
        this.getPriorityLevel(this.preferences.inApp.priority)
    );
  }

  private getPriorityLevel(priority: NotificationPriority): number {
    switch (priority) {
      case 'urgent':
        return 4;
      case 'high':
        return 3;
      case 'medium':
        return 2;
      case 'low':
        return 1;
      default:
        return 0;
    }
  }

  private async sendPushNotification(notification: Notification): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  private async sendEmailNotification(notification: Notification): Promise<void> {
    // Implement email sending logic
  }

  private showInAppNotification(notification: Notification): void {
    // Implement in-app notification display
  }

  private async scheduleReminders(): Promise<void> {
    try {
      // Cancel existing reminders
      await this.cancelScheduledReminders();

      // Schedule new reminders based on preferences
      if (this.preferences.scheduled.reminders.healthChecks) {
        await this.scheduleHealthCheckReminders();
      }

      if (this.preferences.scheduled.reminders.budgetReviews) {
        await this.scheduleBudgetReviewReminders();
      }

      if (this.preferences.scheduled.reminders.inventoryAudits) {
        await this.scheduleInventoryAuditReminders();
      }

      if (this.preferences.scheduled.reminders.maintenance) {
        await this.scheduleMaintenanceReminders();
      }
    } catch (error) {
      console.error('Error scheduling reminders:', error);
    }
  }

  private async cancelScheduledReminders(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling scheduled reminders:', error);
    }
  }

  private async scheduleHealthCheckReminders(): Promise<void> {
    // Implement health check reminder scheduling
  }

  private async scheduleBudgetReviewReminders(): Promise<void> {
    // Implement budget review reminder scheduling
  }

  private async scheduleInventoryAuditReminders(): Promise<void> {
    // Implement inventory audit reminder scheduling
  }

  private async scheduleMaintenanceReminders(): Promise<void> {
    // Implement maintenance reminder scheduling
  }

  private async storeNotification(notification: Notification): Promise<void> {
    try {
      const notifications = await this.loadNotifications();
      notifications.unshift(notification);
      await this.storeNotifications(notifications);
    } catch (error) {
      console.error('Error storing notification:', error);
      throw error;
    }
  }

  private async loadNotifications(): Promise<Notification[]> {
    try {
      const notificationsJson = await SecureStore.getItemAsync(this.NOTIFICATIONS_KEY);
      return notificationsJson ? JSON.parse(notificationsJson) : [];
    } catch (error) {
      console.error('Error loading notifications:', error);
      return [];
    }
  }

  private async storeNotifications(notifications: Notification[]): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        this.NOTIFICATIONS_KEY,
        JSON.stringify(notifications)
      );
    } catch (error) {
      console.error('Error storing notifications:', error);
      throw error;
    }
  }

  private async savePreferences(): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        this.PREFERENCES_KEY,
        JSON.stringify(this.preferences)
      );
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      throw error;
    }
  }

  private async loadPreferences(): Promise<NotificationPreferences | null> {
    try {
      const preferencesJson = await SecureStore.getItemAsync(this.PREFERENCES_KEY);
      return preferencesJson ? JSON.parse(preferencesJson) : null;
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      return null;
    }
  }
} 