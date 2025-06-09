export interface Location {
  latitude: number;
  longitude: number;
}

export type PastureStatus = 'grazing' | 'rest' | 'preparation';

export interface Pasture {
  id: string;
  name: string;
  size: number;
  status: PastureStatus;
  location: Location;
  lastGrazed: string;
  soilHealth: {
    organicMatter: number;
    ph: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
  vegetation: {
    type: string;
    height: number;
    density: number;
  };
}

export type GrazingEventType = 'move' | 'check' | 'sample';
export type GrazingEventStatus = 'completed' | 'scheduled' | 'cancelled';

export interface GrazingEvent {
  id: string;
  pastureId: string;
  type: GrazingEventType;
  status: GrazingEventStatus;
  date: string;
  notes?: string;
  metrics?: {
    animalCount?: number;
    grazingHeight?: number;
    recoveryDays?: number;
  };
}

export interface GrazingPlan {
  id: string | null;
  name: string;
  startDate: string;
  endDate: string;
  rotations: Array<{
    pastureId: string;
    startDate: string;
    endDate: string;
    animalCount: number;
  }>;
}

export interface GrazingState {
  pastures: {
    items: Pasture[];
    loading: boolean;
    error: string | null;
  };
  grazingEvents: {
    items: GrazingEvent[];
    loading: boolean;
    error: string | null;
  };
  currentPlan: GrazingPlan | null;
  offlineMode: boolean;
} 