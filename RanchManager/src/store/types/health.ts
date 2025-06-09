export enum HealthEventType {
  Vaccination = 'vaccination',
  Treatment = 'treatment',
  Illness = 'illness',
  Injury = 'injury',
  Checkup = 'checkup',
  Other = 'other',
}

export enum HealthSeverity {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export interface FileWithUri {
  uri: string;
  name: string;
  type?: string;
  size?: number;
}

export interface HealthRecord {
  id: string;
  cattleId: string;
  cattleName?: string;
  date: Date;
  type: HealthEventType;
  description: string;
  severity: HealthSeverity;
  treatment?: string;
  followUpDate?: Date;
  attachments: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  resolved?: boolean;
  resolvedAt?: Date;
  medication?: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  veterinarian?: {
    name: string;
    contact: string;
  };
}

export interface HealthFilters {
  startDate?: Date;
  endDate?: Date;
  types?: HealthEventType[];
  severities?: HealthSeverity[];
  resolved?: boolean;
  searchQuery?: string;
}

export interface HealthState {
  records: HealthRecord[];
  selectedRecord: HealthRecord | null;
  loading: boolean;
  error: string | null;
  filters: HealthFilters;
  lastSync: Date | null;
  isOffline: boolean;
}

export interface HealthApiResponse {
  records: HealthRecord[];
  timestamp: string;
}

export interface CreateHealthRecordInput {
  cattleId: string;
  cattleName?: string;
  date: Date;
  type: HealthEventType;
  description: string;
  severity: HealthSeverity;
  treatment?: string;
  followUpDate?: Date;
  attachments?: FileWithUri[];
  notes?: string;
  resolved?: boolean;
  resolvedAt?: Date;
  medication?: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  veterinarian?: {
    name: string;
    contact: string;
  };
}

export interface UpdateHealthRecordInput {
  cattleId?: string;
  cattleName?: string;
  date?: Date;
  type?: HealthEventType;
  description?: string;
  severity?: HealthSeverity;
  treatment?: string;
  followUpDate?: Date;
  attachments?: FileWithUri[];
  removedAttachments?: string[];
  notes?: string;
  resolved?: boolean;
  resolvedAt?: Date;
  medication?: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  veterinarian?: {
    name: string;
    contact: string;
  };
} 