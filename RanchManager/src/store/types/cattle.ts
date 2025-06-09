export enum Gender {
  Male = 'male',
  Female = 'female',
}

export enum CattleStatus {
  Active = 'active',
  Sold = 'sold',
  Deceased = 'deceased',
  Transferred = 'transferred',
  Inactive = 'inactive',
}

export enum CattleBreed {
  Angus = 'angus',
  Hereford = 'hereford',
  Holstein = 'holstein',
  Jersey = 'jersey',
  Brahman = 'brahman',
  Other = 'other',
}

export interface WeightRecord {
  id: string;
  cattleId: string;
  date: Date;
  weight: number;
}

export interface Cattle {
  id: string;
  tag: string;
  breed: string;
  birthDate: Date;
  gender: 'male' | 'female';
  weight: number;
  financialSummary: CattleFinancialSummary;
}

export interface CattleGroup {
  id: string;
  name: string;
  description?: string;
  cattleIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CattleFinancialSummary {
  cattleId: string;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  roi: number;
  lastUpdated: Date;
}

export interface CattleState {
  items: Cattle[];
  groups: CattleGroup[];
  weightRecords: WeightRecord[];
  financialSummaries: CattleFinancialSummary[];
  selectedCattleId: string | null;
  selectedGroupId: string | null;
  loading: boolean;
  error: string | null;
  filters: {
    status?: CattleStatus;
    breed?: CattleBreed;
    groupId?: string;
    search?: string;
  };
  selectedCattle: Cattle | null;
} 