export type AlertSeverity = 'low' | 'medium' | 'high';

export type ActivityType = 'weight' | 'health' | 'movement' | 'feeding' | 'other';

export interface HealthAlert {
  id: string;
  cattleId: string;
  cattleName: string;
  severity: AlertSeverity;
  description: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: Date;
  cattleId?: string;
  cattleName?: string;
  metadata?: Record<string, any>;
}

export interface DashboardMetrics {
  totalCattle: number;
  activeCattle: number;
  sickCattle: number;
  underObservation: number;
  totalWeight: number;
  averageWeight: number;
  lastUpdated: Date;
}

export interface DashboardState {
  metrics: DashboardMetrics;
  healthAlerts: HealthAlert[];
  recentActivities: Activity[];
  loading: boolean;
  error: string | null;
  lastSync: Date | null;
  isOffline: boolean;
}

export interface DashboardApiResponse {
  metrics: DashboardMetrics;
  healthAlerts: HealthAlert[];
  recentActivities: Activity[];
  timestamp: string;
} 