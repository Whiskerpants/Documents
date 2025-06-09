export enum BreedingStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Failed = 'failed',
  Aborted = 'aborted',
}

export enum BreedingMethod {
  Natural = 'natural',
  ArtificialInsemination = 'artificial_insemination',
  EmbryoTransfer = 'embryo_transfer',
}

export enum PregnancyOutcome {
  LiveBirth = 'live_birth',
  Stillbirth = 'stillbirth',
  Abortion = 'abortion',
  Unknown = 'unknown',
}

export enum PregnancyStatus {
  Confirmed = 'confirmed',
  DueSoon = 'due_soon',
  Overdue = 'overdue',
  Completed = 'completed',
  Lost = 'lost',
}

export interface Breeding {
  id: string;
  damId: string;
  damName: string;
  sireId: string;
  sireName: string;
  breedingDate: Date;
  method: BreedingMethod;
  notes?: string;
  status: BreedingStatus;
  technician?: string;
  location?: string;
  cost?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Pregnancy {
  id: string;
  breedingId: string;
  damId: string;
  damName: string;
  confirmationDate: Date;
  expectedDueDate: Date;
  actualBirthDate?: Date;
  outcome?: PregnancyOutcome;
  status: PregnancyStatus;
  gestationPeriod: number; // in days
  pregnancyChecks: PregnancyCheck[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PregnancyCheck {
  id: string;
  date: Date;
  result: 'positive' | 'negative' | 'inconclusive';
  method: 'ultrasound' | 'palpation' | 'blood_test' | 'other';
  notes?: string;
  performedBy: string;
}

export interface Birth {
  id: string;
  pregnancyId: string;
  damId: string;
  damName: string;
  birthDate: Date;
  birthTime: string;
  location: string;
  calfIds: string[];
  calfDetails: {
    id: string;
    tagNumber: string;
    gender: 'male' | 'female';
    weight: number;
    notes?: string;
  }[];
  complications: string[];
  assistanceRequired: boolean;
  assistanceType?: 'manual' | 'mechanical' | 'veterinary';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LineageRecord {
  id: string;
  animalId: string;
  animalName: string;
  sireId?: string;
  sireName?: string;
  damId?: string;
  damName?: string;
  generation: number;
  birthDate: Date;
  breed: string;
  geneticProfile?: GeneticProfile;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneticProfile {
  id: string;
  animalId: string;
  traits: {
    name: string;
    value: number;
    heritability: number;
  }[];
  breedingValues: {
    trait: string;
    value: number;
    accuracy: number;
  }[];
  dnaTestResults?: {
    testDate: Date;
    lab: string;
    results: {
      marker: string;
      value: string;
    }[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface BreedingFilters {
  status?: BreedingStatus;
  method?: BreedingMethod;
  damId?: string;
  sireId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PregnancyFilters {
  status?: PregnancyStatus;
  damId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface BreedingState {
  breedings: Breeding[];
  pregnancies: Pregnancy[];
  births: Birth[];
  lineageRecords: LineageRecord[];
  geneticProfiles: GeneticProfile[];
  selectedBreeding: Breeding | null;
  selectedPregnancy: Pregnancy | null;
  selectedBirth: Birth | null;
  loading: boolean;
  error: string | null;
  filters: BreedingFilters;
  pregnancyFilters: PregnancyFilters;
  lastSync: Date | null;
  isOffline: boolean;
}

export interface CreateBreedingInput {
  damId: string;
  sireId: string;
  breedingDate: Date;
  method: BreedingMethod;
  notes?: string;
  technician?: string;
  location?: string;
  cost?: number;
}

export interface UpdateBreedingInput {
  status?: BreedingStatus;
  notes?: string;
  technician?: string;
  location?: string;
  cost?: number;
}

export interface CreatePregnancyInput {
  breedingId: string;
  damId: string;
  confirmationDate: Date;
  gestationPeriod: number;
  notes?: string;
}

export interface UpdatePregnancyInput {
  status?: PregnancyStatus;
  expectedDueDate?: Date;
  actualBirthDate?: Date;
  outcome?: PregnancyOutcome;
  notes?: string;
}

export interface CreateBirthInput {
  damId: string;
  birthDate: Date;
  calfIds: string[];
  complications?: string;
  notes?: string;
  outcome?: PregnancyOutcome;
}

export interface UpdateBirthInput {
  calfDetails?: {
    id: string;
    tagNumber?: string;
    weight?: number;
    notes?: string;
  }[];
  complications?: string[];
  assistanceRequired?: boolean;
  assistanceType?: 'manual' | 'mechanical' | 'veterinary';
  notes?: string;
} 