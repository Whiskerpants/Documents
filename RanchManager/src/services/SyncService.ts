import { EventEmitter } from 'events';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseService } from './DatabaseService';
import { AuthService } from './AuthService';
import { PerformanceService } from './PerformanceService';

export interface SyncItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  data: any;
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  retryCount: number;
  lastError?: string;
}

export interface SyncConflict {
  id: string;
  entity: string;
  localVersion: any;
  remoteVersion: any;
  resolution?: 'local' | 'remote' | 'merge';
  resolvedAt?: number;
}

export interface SyncStats {
  lastSync: number;
  pendingChanges: number;
  failedChanges: number;
  totalSynced: number;
  bandwidthUsed: number;
  syncDuration: number;
}

export interface SyncPreferences {
  autoSync: boolean;
  syncInterval: number; // in minutes
  syncOnCellular: boolean;
  maxRetries: number;
  conflictStrategy: 'local' | 'remote' | 'prompt';
  priorityOrder: ('high' | 'medium' | 'low')[];
  bandwidthLimit?: number; // in bytes per second
}

export class SyncService {
  private static instance: SyncService;
  public eventEmitter: EventEmitter;
  private db: DatabaseService;
  private auth: AuthService;
  private performance: PerformanceService;
  private syncQueue: SyncItem[] = [];
  private conflicts: SyncConflict[] = [];
  private stats: SyncStats = {
    lastSync: 0,
    pendingChanges: 0,
    failedChanges: 0,
    totalSynced: 0,
    bandwidthUsed: 0,
    syncDuration: 0,
  };
  private preferences: SyncPreferences = {
    autoSync: true,
    syncInterval: 15,
    syncOnCellular: false,
    maxRetries: 3,
    conflictStrategy: 'prompt',
    priorityOrder: ['high', 'medium', 'low'],
  };
  private syncTimer?: NodeJS.Timeout;
  private isSyncing: boolean = false;
  private networkType: string = 'unknown';
  private bandwidthMonitor: {
    startTime: number;
    bytesTransferred: number;
  } = {
    startTime: 0,
    bytesTransferred: 0,
  };

  private constructor() {
    this.eventEmitter = new EventEmitter();
    this.db = DatabaseService.getInstance();
    this.auth = AuthService.getInstance();
    this.performance = PerformanceService.getInstance();
    this.initialize();
  }

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  private async initialize() {
    await this.loadPreferences();
    await this.loadSyncQueue();
    await this.loadConflicts();
    await this.loadStats();
    this.setupNetworkListener();
    this.startAutoSync();
  }

  private async loadPreferences() {
    try {
      const prefs = await AsyncStorage.getItem('syncPreferences');
      if (prefs) {
        this.preferences = { ...this.preferences, ...JSON.parse(prefs) };
      }
    } catch (error) {
      console.error('Error loading sync preferences:', error);
    }
  }

  private async loadSyncQueue() {
    try {
      const queue = await AsyncStorage.getItem('syncQueue');
      if (queue) {
        this.syncQueue = JSON.parse(queue);
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
    }
  }

  private async loadConflicts() {
    try {
      const conflicts = await AsyncStorage.getItem('syncConflicts');
      if (conflicts) {
        this.conflicts = JSON.parse(conflicts);
      }
    } catch (error) {
      console.error('Error loading sync conflicts:', error);
    }
  }

  private async loadStats() {
    try {
      const stats = await AsyncStorage.getItem('syncStats');
      if (stats) {
        this.stats = JSON.parse(stats);
      }
    } catch (error) {
      console.error('Error loading sync stats:', error);
    }
  }

  private setupNetworkListener() {
    NetInfo.addEventListener(state => {
      this.networkType = state.type;
      if (state.isConnected && this.preferences.autoSync) {
        this.startSync();
      }
    });
  }

  private startAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    if (this.preferences.autoSync) {
      this.syncTimer = setInterval(() => {
        this.startSync();
      }, this.preferences.syncInterval * 60 * 1000);
    }
  }

  public async startSync(): Promise<void> {
    if (this.isSyncing) {
      return;
    }

    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      this.eventEmitter.emit('syncError', 'No network connection');
      return;
    }

    if (networkState.type === 'cellular' && !this.preferences.syncOnCellular) {
      this.eventEmitter.emit('syncError', 'Cellular sync disabled');
      return;
    }

    this.isSyncing = true;
    this.bandwidthMonitor = {
      startTime: Date.now(),
      bytesTransferred: 0,
    };

    try {
      this.eventEmitter.emit('syncStart');
      await this.syncPendingChanges();
      await this.resolveConflicts();
      await this.updateStats();
      this.eventEmitter.emit('syncComplete', this.stats);
    } catch (error) {
      console.error('Sync error:', error);
      this.eventEmitter.emit('syncError', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncPendingChanges(): Promise<void> {
    const sortedQueue = this.sortQueueByPriority();
    const startTime = Date.now();

    for (const item of sortedQueue) {
      if (this.shouldThrottleBandwidth()) {
        await this.waitForBandwidth();
      }

      try {
        await this.syncItem(item);
        this.bandwidthMonitor.bytesTransferred += this.estimateItemSize(item);
      } catch (error) {
        console.error(`Error syncing item ${item.id}:`, error);
        item.status = 'failed';
        item.lastError = error.message;
        item.retryCount++;

        if (item.retryCount >= this.preferences.maxRetries) {
          this.eventEmitter.emit('syncItemFailed', item);
        }
      }
    }

    this.stats.syncDuration = Date.now() - startTime;
  }

  private sortQueueByPriority(): SyncItem[] {
    return [...this.syncQueue].sort((a, b) => {
      const priorityOrder = this.preferences.priorityOrder;
      const priorityA = priorityOrder.indexOf(a.priority);
      const priorityB = priorityOrder.indexOf(b.priority);
      return priorityA - priorityB;
    });
  }

  private async syncItem(item: SyncItem): Promise<void> {
    item.status = 'syncing';
    this.eventEmitter.emit('syncItemStart', item);

    const token = await this.auth.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const endpoint = this.getEndpointForEntity(item.entity);
    const response = await fetch(endpoint, {
      method: this.getMethodForType(item.type),
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item.data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    item.status = 'completed';
    this.eventEmitter.emit('syncItemComplete', item);
    await this.removeFromQueue(item.id);
  }

  private async resolveConflicts(): Promise<void> {
    for (const conflict of this.conflicts) {
      if (conflict.resolution) {
        continue;
      }

      switch (this.preferences.conflictStrategy) {
        case 'local':
          await this.resolveConflict(conflict, 'local');
          break;
        case 'remote':
          await this.resolveConflict(conflict, 'remote');
          break;
        case 'prompt':
          this.eventEmitter.emit('conflictDetected', conflict);
          break;
      }
    }
  }

  public async resolveConflict(conflict: SyncConflict, resolution: 'local' | 'remote'): Promise<void> {
    const data = resolution === 'local' ? conflict.localVersion : conflict.remoteVersion;
    await this.db.update(conflict.entity, conflict.id, data);
    conflict.resolution = resolution;
    conflict.resolvedAt = Date.now();
    await this.saveConflicts();
  }

  private shouldThrottleBandwidth(): boolean {
    if (!this.preferences.bandwidthLimit) {
      return false;
    }

    const elapsedTime = (Date.now() - this.bandwidthMonitor.startTime) / 1000;
    const currentBandwidth = this.bandwidthMonitor.bytesTransferred / elapsedTime;
    return currentBandwidth > this.preferences.bandwidthLimit;
  }

  private async waitForBandwidth(): Promise<void> {
    const waitTime = 1000; // 1 second
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  private estimateItemSize(item: SyncItem): number {
    return JSON.stringify(item.data).length;
  }

  private getEndpointForEntity(entity: string): string {
    // TODO: Implement endpoint mapping
    return `https://api.ranchmanager.com/${entity}`;
  }

  private getMethodForType(type: string): string {
    switch (type) {
      case 'create':
        return 'POST';
      case 'update':
        return 'PUT';
      case 'delete':
        return 'DELETE';
      default:
        return 'GET';
    }
  }

  private async removeFromQueue(id: string): Promise<void> {
    this.syncQueue = this.syncQueue.filter(item => item.id !== id);
    await this.saveSyncQueue();
  }

  private async saveSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  private async saveConflicts(): Promise<void> {
    try {
      await AsyncStorage.setItem('syncConflicts', JSON.stringify(this.conflicts));
    } catch (error) {
      console.error('Error saving conflicts:', error);
    }
  }

  private async updateStats(): Promise<void> {
    this.stats.lastSync = Date.now();
    this.stats.pendingChanges = this.syncQueue.length;
    this.stats.failedChanges = this.syncQueue.filter(item => item.status === 'failed').length;
    this.stats.bandwidthUsed = this.bandwidthMonitor.bytesTransferred;

    try {
      await AsyncStorage.setItem('syncStats', JSON.stringify(this.stats));
    } catch (error) {
      console.error('Error saving sync stats:', error);
    }
  }

  public async addToQueue(item: Omit<SyncItem, 'id' | 'timestamp' | 'status' | 'retryCount'>): Promise<void> {
    const syncItem: SyncItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    this.syncQueue.push(syncItem);
    await this.saveSyncQueue();
    this.eventEmitter.emit('queueUpdated', this.syncQueue);

    if (this.preferences.autoSync) {
      this.startSync();
    }
  }

  public async updatePreferences(preferences: Partial<SyncPreferences>): Promise<void> {
    this.preferences = { ...this.preferences, ...preferences };
    await AsyncStorage.setItem('syncPreferences', JSON.stringify(this.preferences));
    this.startAutoSync();
  }

  public getStats(): SyncStats {
    return { ...this.stats };
  }

  public getQueue(): SyncItem[] {
    return [...this.syncQueue];
  }

  public getConflicts(): SyncConflict[] {
    return [...this.conflicts];
  }

  public getPreferences(): SyncPreferences {
    return { ...this.preferences };
  }

  public onSyncStart(callback: () => void): void {
    this.eventEmitter.on('syncStart', callback);
  }

  public onSyncComplete(callback: (stats: SyncStats) => void): void {
    this.eventEmitter.on('syncComplete', callback);
  }

  public onSyncError(callback: (error: string) => void): void {
    this.eventEmitter.on('syncError', callback);
  }

  public onQueueUpdated(callback: (queue: SyncItem[]) => void): void {
    this.eventEmitter.on('queueUpdated', callback);
  }

  public onConflictDetected(callback: (conflict: SyncConflict) => void): void {
    this.eventEmitter.on('conflictDetected', callback);
  }

  public onSyncItemStart(callback: (item: SyncItem) => void): void {
    this.eventEmitter.on('syncItemStart', callback);
  }

  public onSyncItemComplete(callback: (item: SyncItem) => void): void {
    this.eventEmitter.on('syncItemComplete', callback);
  }

  public onSyncItemFailed(callback: (item: SyncItem) => void): void {
    this.eventEmitter.on('syncItemFailed', callback);
  }
} 