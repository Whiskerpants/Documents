import { Platform } from 'react-native';
import { PerformanceObserver, performance } from 'perf_hooks';

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceThreshold {
  name: string;
  threshold: number;
  unit: 'ms' | 'MB';
}

export class PerformanceService {
  private static instance: PerformanceService;
  private metrics: PerformanceMetric[] = [];
  private thresholds: PerformanceThreshold[] = [
    { name: 'transaction_list_render', threshold: 16, unit: 'ms' }, // 60fps
    { name: 'api_request', threshold: 1000, unit: 'ms' },
    { name: 'state_update', threshold: 50, unit: 'ms' },
    { name: 'calculation', threshold: 100, unit: 'ms' },
    { name: 'memory_usage', threshold: 100, unit: 'MB' },
  ];

  private constructor() {
    if (Platform.OS === 'web') {
      this.initializeWebPerformanceObserver();
    }
  }

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  private initializeWebPerformanceObserver() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric({
          name: entry.name,
          duration: entry.duration,
          timestamp: entry.startTime,
        });
      }
    });

    observer.observe({ entryTypes: ['measure'] });
  }

  startMeasure(name: string) {
    if (Platform.OS === 'web') {
      performance.mark(`${name}_start`);
    }
  }

  endMeasure(name: string, metadata?: Record<string, any>) {
    if (Platform.OS === 'web') {
      performance.mark(`${name}_end`);
      performance.measure(name, `${name}_start`, `${name}_end`);
    }

    const duration = this.getDuration(name);
    this.recordMetric({ name, duration, timestamp: Date.now(), metadata });
    this.checkThresholds(name, duration);
  }

  private getDuration(name: string): number {
    if (Platform.OS === 'web') {
      const entries = performance.getEntriesByName(name);
      return entries[entries.length - 1]?.duration || 0;
    }
    return 0;
  }

  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  private checkThresholds(name: string, duration: number) {
    const threshold = this.thresholds.find(t => t.name === name);
    if (threshold && duration > threshold.threshold) {
      console.warn(`Performance threshold exceeded for ${name}: ${duration}${threshold.unit}`);
    }
  }

  getMetrics(name?: string): PerformanceMetric[] {
    return name
      ? this.metrics.filter(m => m.name === name)
      : this.metrics;
  }

  getAverageMetric(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
  }

  clearMetrics() {
    this.metrics = [];
  }

  async measureAsync<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.startMeasure(name);
    try {
      const result = await operation();
      return result;
    } finally {
      this.endMeasure(name, metadata);
    }
  }

  measureSync<T>(
    name: string,
    operation: () => T,
    metadata?: Record<string, any>
  ): T {
    this.startMeasure(name);
    try {
      return operation();
    } finally {
      this.endMeasure(name, metadata);
    }
  }
} 