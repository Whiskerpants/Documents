import { Platform } from 'react-native';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { PerformanceService } from './performanceService';

// Define FinancialReport interface
interface FinancialReport {
  id: string;
  type: string;
  data: any;
  generatedAt: Date;
  status: 'pending' | 'completed' | 'failed';
}

// Task names
const BACKGROUND_SYNC_TASK = 'BACKGROUND_SYNC_TASK';
const REPORT_GENERATION_TASK = 'REPORT_GENERATION_TASK';
const DAILY_SUMMARY_TASK = 'DAILY_SUMMARY_TASK';
const DATA_EXPORT_TASK = 'DATA_EXPORT_TASK';

interface TaskConfig {
  taskName: string;
  interval: number; // in minutes
  options?: BackgroundFetch.BackgroundFetchOptions;
}

interface BatchProcessingConfig {
  batchSize: number;
  maxConcurrent: number;
  retryAttempts: number;
  retryDelay: number; // in milliseconds
}

export class WorkerService {
  private static instance: WorkerService;
  private perfService: PerformanceService;
  private isInitialized: boolean = false;
  private taskConfigs: Map<string, TaskConfig> = new Map();
  private batchConfigs: Map<string, BatchProcessingConfig> = new Map();

  private constructor() {
    this.perfService = PerformanceService.getInstance();
    this.initializeTaskConfigs();
  }

  static getInstance(): WorkerService {
    if (!WorkerService.instance) {
      WorkerService.instance = new WorkerService();
    }
    return WorkerService.instance;
  }

  private initializeTaskConfigs() {
    this.taskConfigs.set(BACKGROUND_SYNC_TASK, {
      taskName: BACKGROUND_SYNC_TASK,
      interval: 15, // 15 minutes
      options: {
        minimumInterval: 15 * 60, // 15 minutes in seconds
        stopOnTerminate: false,
        startOnBoot: true,
      },
    });

    this.taskConfigs.set(REPORT_GENERATION_TASK, {
      taskName: REPORT_GENERATION_TASK,
      interval: 60, // 1 hour
      options: {
        minimumInterval: 60 * 60,
        stopOnTerminate: false,
        startOnBoot: true,
      },
    });

    this.taskConfigs.set(DAILY_SUMMARY_TASK, {
      taskName: DAILY_SUMMARY_TASK,
      interval: 24 * 60, // 24 hours
      options: {
        minimumInterval: 24 * 60 * 60,
        stopOnTerminate: false,
        startOnBoot: true,
      },
    });

    this.taskConfigs.set(DATA_EXPORT_TASK, {
      taskName: DATA_EXPORT_TASK,
      interval: 0, // Manual trigger only
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Register background tasks
      this.registerBackgroundTasks();
      
      // Initialize background fetch
      await this.initializeBackgroundFetch();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing WorkerService:', error);
      throw error;
    }
  }

  private registerBackgroundTasks() {
    // Register background sync task
    TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
      return this.perfService.measureAsync('background_sync', async () => {
        try {
          await this.processBatchSync();
          return BackgroundFetch.BackgroundFetchResult.NewData;
        } catch (error) {
          console.error('Background sync failed:', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });
    });

    // Register report generation task
    TaskManager.defineTask(REPORT_GENERATION_TASK, async () => {
      return this.perfService.measureAsync('report_generation', async () => {
        try {
          await this.generateScheduledReports();
          return BackgroundFetch.BackgroundFetchResult.NewData;
        } catch (error) {
          console.error('Report generation failed:', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });
    });

    // Register daily summary task
    TaskManager.defineTask(DAILY_SUMMARY_TASK, async () => {
      return this.perfService.measureAsync('daily_summary', async () => {
        try {
          await this.generateDailySummary();
          return BackgroundFetch.BackgroundFetchResult.NewData;
        } catch (error) {
          console.error('Daily summary generation failed:', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });
    });

    // Register data export task
    TaskManager.defineTask(DATA_EXPORT_TASK, async ({ data }) => {
      return this.perfService.measureAsync('data_export', async () => {
        try {
          await this.processDataExport(data);
          return BackgroundFetch.BackgroundFetchResult.NewData;
        } catch (error) {
          console.error('Data export failed:', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });
    });
  }

  private async initializeBackgroundFetch() {
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: this.taskConfigs.get(BACKGROUND_SYNC_TASK)!.options!.minimumInterval,
        stopOnTerminate: false,
        startOnBoot: true,
      });

      await BackgroundFetch.registerTaskAsync(REPORT_GENERATION_TASK, {
        minimumInterval: this.taskConfigs.get(REPORT_GENERATION_TASK)!.options!.minimumInterval,
        stopOnTerminate: false,
        startOnBoot: true,
      });

      await BackgroundFetch.registerTaskAsync(DAILY_SUMMARY_TASK, {
        minimumInterval: this.taskConfigs.get(DAILY_SUMMARY_TASK)!.options!.minimumInterval,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    } catch (error) {
      console.error('Error registering background tasks:', error);
      throw error;
    }
  }

  // Batch Processing Methods
  async processBatchSync(): Promise<void> {
    const config = this.getBatchConfig('sync');
    const items = await this.getPendingSyncItems();
    
    for (let i = 0; i < items.length; i += config.batchSize) {
      const batch = items.slice(i, i + config.batchSize);
      await this.processBatchWithRetry(batch, this.syncBatch.bind(this), config);
    }
  }

  private async processBatchWithRetry<T>(
    items: T[],
    processor: (items: T[]) => Promise<void>,
    config: BatchProcessingConfig
  ): Promise<void> {
    let attempts = 0;
    while (attempts < config.retryAttempts) {
      try {
        await processor(items);
        return;
      } catch (error) {
        attempts++;
        if (attempts === config.retryAttempts) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, config.retryDelay));
      }
    }
  }

  // Report Generation
  async generateReport(reportType: string, options: any): Promise<FinancialReport> {
    return this.perfService.measureAsync('report_generation', async () => {
      // Move report generation to background task
      const taskId = await TaskManager.isTaskRegisteredAsync(REPORT_GENERATION_TASK);
      if (!taskId) {
        throw new Error('Report generation task not registered');
      }

      // Queue the report generation
      await TaskManager.defineTask(REPORT_GENERATION_TASK, async () => {
        const report = await this.generateReportInBackground(reportType, options);
        return report;
      });

      return {} as FinancialReport; // Return placeholder, actual report will be available later
    });
  }

  private async generateReportInBackground(reportType: string, options: any): Promise<FinancialReport> {
    // Implement actual report generation logic here
    return {} as FinancialReport;
  }

  // Daily Summary
  private async generateDailySummary(): Promise<void> {
    return this.perfService.measureAsync('daily_summary', async () => {
      const today = new Date();
      const summary = await this.calculateDailySummary(today);
      await this.storeDailySummary(summary);
    });
  }

  private async calculateDailySummary(date: Date): Promise<any> {
    // Implement daily summary calculation logic
    return {};
  }

  // Data Export
  async exportData(options: any): Promise<void> {
    return this.perfService.measureAsync('data_export', async () => {
      const taskId = await TaskManager.isTaskRegisteredAsync(DATA_EXPORT_TASK);
      if (!taskId) {
        throw new Error('Data export task not registered');
      }

      await TaskManager.defineTask(DATA_EXPORT_TASK, async () => {
        await this.processDataExport(options);
      });
    });
  }

  private async processDataExport(options: any): Promise<void> {
    const config = this.getBatchConfig('export');
    const data = await this.prepareExportData(options);
    
    for (let i = 0; i < data.length; i += config.batchSize) {
      const batch = data.slice(i, i + config.batchSize);
      await this.processBatchWithRetry(batch, this.exportBatch.bind(this), config);
    }
  }

  // Helper Methods
  private getBatchConfig(type: string): BatchProcessingConfig {
    return this.batchConfigs.get(type) || {
      batchSize: 100,
      maxConcurrent: 3,
      retryAttempts: 3,
      retryDelay: 1000,
    };
  }

  private async getPendingSyncItems(): Promise<any[]> {
    // Implement logic to get pending sync items
    return [];
  }

  private async syncBatch(items: any[]): Promise<void> {
    // Implement batch sync logic
  }

  private async exportBatch(items: any[]): Promise<void> {
    // Implement batch export logic
  }

  private async storeDailySummary(summary: any): Promise<void> {
    // Implement daily summary storage logic
  }

  private async prepareExportData(options: any): Promise<any[]> {
    // Implement export data preparation logic
    return [];
  }

  // Add missing method
  private async generateScheduledReports(): Promise<void> {
    return this.perfService.measureAsync('scheduled_reports', async () => {
      try {
        const scheduledReports = await this.getScheduledReports();
        for (const report of scheduledReports) {
          await this.generateReportInBackground(report.type, report.options);
        }
      } catch (error) {
        console.error('Error generating scheduled reports:', error);
        throw error;
      }
    });
  }

  private async getScheduledReports(): Promise<Array<{ type: string; options: any }>> {
    // Implement logic to get scheduled reports
    return [];
  }
} 