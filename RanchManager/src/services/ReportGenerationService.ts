import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { WorkerService } from './workerService';
import { PerformanceService } from './performanceService';
import { FinancialReport } from '../store/types/financial';
import { ChartData, ChartOptions } from '../types/charts';
import { PDFDocument, rgb } from 'pdf-lib';
import * as XLSX from 'xlsx';
import { EventEmitter } from 'events';

// Types
interface ReportConfig {
  type: ReportType;
  dateRange: {
    start: Date;
    end: Date;
  };
  grouping?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  metrics?: string[];
  filters?: Record<string, any>;
  visualization?: VisualizationConfig;
  export?: ExportConfig;
}

interface VisualizationConfig {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'table';
  options?: ChartOptions;
  theme?: 'light' | 'dark';
  interactive?: boolean;
}

interface ExportConfig {
  format: 'pdf' | 'csv' | 'excel' | 'json';
  template?: string;
  compression?: boolean;
  delivery?: {
    method: 'email' | 'share' | 'download';
    recipients?: string[];
    schedule?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      time?: string;
    };
  };
}

interface ReportProgress {
  stage: 'preparing' | 'aggregating' | 'calculating' | 'visualizing' | 'exporting';
  progress: number;
  message: string;
  estimatedTimeRemaining?: number;
}

type ReportType = 
  | 'income_statement'
  | 'category_breakdown'
  | 'budget_performance'
  | 'entity_profitability'
  | 'custom';

// Report Generation Service
export class ReportGenerationService {
  private static instance: ReportGenerationService;
  private workerService: WorkerService;
  private perfService: PerformanceService;
  private eventEmitter: EventEmitter;
  private cache: Map<string, any>;
  private readonly CACHE_DIR = `${FileSystem.cacheDirectory}reports/`;
  private readonly TEMP_DIR = `${FileSystem.cacheDirectory}temp/`;

  private constructor() {
    this.workerService = WorkerService.getInstance();
    this.perfService = PerformanceService.getInstance();
    this.eventEmitter = new EventEmitter();
    this.cache = new Map();
    this.initializeDirectories();
  }

  static getInstance(): ReportGenerationService {
    if (!ReportGenerationService.instance) {
      ReportGenerationService.instance = new ReportGenerationService();
    }
    return ReportGenerationService.instance;
  }

  private async initializeDirectories() {
    try {
      await FileSystem.makeDirectoryAsync(this.CACHE_DIR, { intermediates: true });
      await FileSystem.makeDirectoryAsync(this.TEMP_DIR, { intermediates: true });
    } catch (error) {
      console.error('Error initializing report directories:', error);
    }
  }

  // Report Generation
  async generateReport(config: ReportConfig): Promise<FinancialReport> {
    return this.perfService.measureAsync('report_generation', async () => {
      try {
        // Check cache first
        const cacheKey = this.generateCacheKey(config);
        const cachedReport = await this.getCachedReport(cacheKey);
        if (cachedReport) {
          return cachedReport;
        }

        // Initialize report
        const report: FinancialReport = {
          id: this.generateReportId(),
          type: config.type,
          data: null,
          generatedAt: new Date(),
          status: 'pending',
        };

        // Start background processing
        await this.workerService.generateReport(config.type, {
          ...config,
          reportId: report.id,
        });

        return report;
      } catch (error) {
        console.error('Error generating report:', error);
        throw error;
      }
    });
  }

  // Data Aggregation
  private async aggregateData(
    data: any[],
    config: ReportConfig
  ): Promise<Record<string, any>> {
    return this.perfService.measureAsync('data_aggregation', async () => {
      try {
        const groupedData = this.groupData(data, config.grouping || 'month');
        const metrics = this.calculateMetrics(groupedData, config.metrics || []);
        const analysis = this.performStatisticalAnalysis(metrics);
        
        return {
          groupedData,
          metrics,
          analysis,
        };
      } catch (error) {
        console.error('Error aggregating data:', error);
        throw error;
      }
    });
  }

  private groupData(
    data: any[],
    grouping: 'day' | 'week' | 'month' | 'quarter' | 'year'
  ): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    
    data.forEach(item => {
      const date = new Date(item.date);
      let key: string;
      
      switch (grouping) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const week = this.getWeekNumber(date);
          key = `${date.getFullYear()}-W${week}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
          break;
        case 'quarter':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${quarter}`;
          break;
        case 'year':
          key = date.getFullYear().toString();
          break;
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });
    
    return groups;
  }

  private calculateMetrics(
    groupedData: Record<string, any[]>,
    metrics: string[]
  ): Record<string, any> {
    const results: Record<string, any> = {};
    
    Object.entries(groupedData).forEach(([key, items]) => {
      results[key] = {};
      
      metrics.forEach(metric => {
        switch (metric) {
          case 'total':
            results[key].total = items.reduce((sum, item) => sum + item.amount, 0);
            break;
          case 'average':
            results[key].average = results[key].total / items.length;
            break;
          case 'count':
            results[key].count = items.length;
            break;
          case 'growth':
            if (key !== Object.keys(groupedData)[0]) {
              const prevKey = Object.keys(groupedData)[
                Object.keys(groupedData).indexOf(key) - 1
              ];
              const prevTotal = results[prevKey].total;
              results[key].growth = ((results[key].total - prevTotal) / prevTotal) * 100;
            }
            break;
        }
      });
    });
    
    return results;
  }

  private performStatisticalAnalysis(
    metrics: Record<string, any>
  ): Record<string, any> {
    const values = Object.values(metrics).map(m => m.total);
    
    return {
      mean: this.calculateMean(values),
      median: this.calculateMedian(values),
      standardDeviation: this.calculateStandardDeviation(values),
      outliers: this.detectOutliers(values),
    };
  }

  // Visualization Generation
  private async generateVisualizations(
    data: any,
    config: VisualizationConfig
  ): Promise<ChartData[]> {
    return this.perfService.measureAsync('visualization_generation', async () => {
      try {
        const charts: ChartData[] = [];
        
        switch (config.type) {
          case 'bar':
            charts.push(this.generateBarChart(data, config));
            break;
          case 'line':
            charts.push(this.generateLineChart(data, config));
            break;
          case 'pie':
            charts.push(this.generatePieChart(data, config));
            break;
          case 'scatter':
            charts.push(this.generateScatterPlot(data, config));
            break;
          case 'table':
            charts.push(this.generateTable(data, config));
            break;
        }
        
        return charts;
      } catch (error) {
        console.error('Error generating visualizations:', error);
        throw error;
      }
    });
  }

  private generateBarChart(
    data: any,
    config: VisualizationConfig
  ): ChartData {
    // Implement bar chart generation
    return {} as ChartData;
  }

  private generateLineChart(
    data: any,
    config: VisualizationConfig
  ): ChartData {
    // Implement line chart generation
    return {} as ChartData;
  }

  private generatePieChart(
    data: any,
    config: VisualizationConfig
  ): ChartData {
    // Implement pie chart generation
    return {} as ChartData;
  }

  private generateScatterPlot(
    data: any,
    config: VisualizationConfig
  ): ChartData {
    // Implement scatter plot generation
    return {} as ChartData;
  }

  private generateTable(
    data: any,
    config: VisualizationConfig
  ): ChartData {
    // Implement table generation
    return {} as ChartData;
  }

  // Export Generation
  private async generateExport(
    data: any,
    config: ExportConfig
  ): Promise<string> {
    return this.perfService.measureAsync('export_generation', async () => {
      try {
        let exportPath: string;
        
        switch (config.format) {
          case 'pdf':
            exportPath = await this.generatePDF(data, config);
            break;
          case 'csv':
            exportPath = await this.generateCSV(data);
            break;
          case 'excel':
            exportPath = await this.generateExcel(data);
            break;
          case 'json':
            exportPath = await this.generateJSON(data);
            break;
        }
        
        if (config.compression) {
          exportPath = await this.compressFile(exportPath);
        }
        
        return exportPath;
      } catch (error) {
        console.error('Error generating export:', error);
        throw error;
      }
    });
  }

  private async generatePDF(
    data: any,
    config: ExportConfig
  ): Promise<string> {
    const pdfDoc = await PDFDocument.create();
    // Implement PDF generation
    return '';
  }

  private async generateCSV(data: any): Promise<string> {
    // Implement CSV generation
    return '';
  }

  private async generateExcel(data: any): Promise<string> {
    const workbook = XLSX.utils.book_new();
    // Implement Excel generation
    return '';
  }

  private async generateJSON(data: any): Promise<string> {
    // Implement JSON generation
    return '';
  }

  private async compressFile(filePath: string): Promise<string> {
    // Implement file compression
    return filePath;
  }

  // Cache Management
  private async getCachedReport(cacheKey: string): Promise<FinancialReport | null> {
    try {
      const cachedData = this.cache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const filePath = `${this.CACHE_DIR}${cacheKey}.json`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(filePath);
        const report = JSON.parse(content);
        this.cache.set(cacheKey, report);
        return report;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting cached report:', error);
      return null;
    }
  }

  private async cacheReport(
    cacheKey: string,
    report: FinancialReport
  ): Promise<void> {
    try {
      this.cache.set(cacheKey, report);
      const filePath = `${this.CACHE_DIR}${cacheKey}.json`;
      await FileSystem.writeAsStringAsync(
        filePath,
        JSON.stringify(report)
      );
    } catch (error) {
      console.error('Error caching report:', error);
    }
  }

  // Helper Methods
  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(config: ReportConfig): string {
    return `${config.type}_${config.dateRange.start.toISOString()}_${config.dateRange.end.toISOString()}`;
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  private calculateMean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = this.calculateMean(values);
    const squareDiffs = values.map(value => {
      const diff = value - mean;
      return diff * diff;
    });
    const avgSquareDiff = this.calculateMean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }

  private detectOutliers(values: number[]): number[] {
    const mean = this.calculateMean(values);
    const stdDev = this.calculateStandardDeviation(values);
    const threshold = 2; // Number of standard deviations
    
    return values.filter(value => 
      Math.abs(value - mean) > threshold * stdDev
    );
  }

  // Event Handling
  onProgress(callback: (progress: ReportProgress) => void): void {
    this.eventEmitter.on('progress', callback);
  }

  onComplete(callback: (report: FinancialReport) => void): void {
    this.eventEmitter.on('complete', callback);
  }

  onError(callback: (error: Error) => void): void {
    this.eventEmitter.on('error', callback);
  }

  // Cleanup
  async clearCache(): Promise<void> {
    try {
      await FileSystem.deleteAsync(this.CACHE_DIR, { idempotent: true });
      await FileSystem.deleteAsync(this.TEMP_DIR, { idempotent: true });
      this.cache.clear();
      await this.initializeDirectories();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
} 