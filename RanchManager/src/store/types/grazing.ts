export enum PastureStatus {
  ACTIVE = 'active',
  RESTING = 'resting',
  SCHEDULED = 'scheduled',
  MAINTENANCE = 'maintenance',
  INACTIVE = 'inactive'
}

export enum SoilType {
  CLAY = 'clay',
  SANDY = 'sandy',
  LOAM = 'loam',
  SILT = 'silt',
  PEAT = 'peat',
  CHALK = 'chalk',
  MIXED = 'mixed'
}

export enum VegetationType {
  NATIVE_GRASS = 'native_grass',
  IMPROVED_GRASS = 'improved_grass',
  LEGUME = 'legume',
  FORB = 'forb',
  WOODY = 'woody',
  COVER_CROP = 'cover_crop',
  MIXED = 'mixed'
}

export enum WeatherCondition {
  SUNNY = 'sunny',
  PARTLY_CLOUDY = 'partly_cloudy',
  CLOUDY = 'cloudy',
  RAINY = 'rainy',
  STORMY = 'stormy',
  SNOWY = 'snowy',
  FOGGY = 'foggy',
  WINDY = 'windy',
  HAIL = 'hail',
  DROUGHT = 'drought'
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface ForageType {
  id: string;
  name: string;
  growthRate: number; // kg/ha/day
  proteinContent: number; // percentage
  digestibility: number; // percentage
  seasonality: {
    spring: boolean;
    summer: boolean;
    fall: boolean;
    winter: boolean;
  };
}

export interface WaterSource {
  id: string;
  name: string;
  type: 'natural' | 'artificial' | 'pipeline' | 'storage';
  location: GeoPoint;
  capacity: number; // in liters
  currentLevel?: number; // in liters
  lastMaintenance?: Date;
  quality?: {
    ph: number;
    turbidity: number;
    contaminants?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface GrazingHistory {
  id: string;
  startDate: Date;
  endDate: Date;
  cattleGroupId: string;
  cattleGroupName: string;
  stockingRate: number; // animals per hectare
  forageConsumption: number; // kg/ha
  notes?: string;
}

export interface PastureConditions {
  forageHeight: number;
  forageDensity: number;
  soilMoisture: number;
  lastUpdated: Date;
}

export interface Pasture {
  id: string;
  name: string;
  size: number;
  status: PastureStatus;
  location: Location;
  boundaries: Location[];
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

export interface RotationEntry {
  id: string;
  pastureId: string;
  pastureName: string;
  startDate: Date;
  endDate: Date;
  cattleGroups: {
    id: string;
    name: string;
    count: number;
  }[];
  notes?: string;
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

export interface GrazingFilters {
  status?: PastureStatus[];
  minSize?: number;
  maxSize?: number;
  forageTypes?: string[];
  available?: boolean;
  search?: string;
}

export interface GrazingState {
  pastures: {
    items: Pasture[];
    loading: boolean;
    error: string | null;
  };
  waterSources: {
    items: WaterSource[];
    loading: boolean;
    error: string | null;
  };
  grazingEvents: {
    items: GrazingEvent[];
    loading: boolean;
    error: string | null;
  };
  forageMeasurements: {
    items: ForageMeasurement[];
    loading: boolean;
    error: string | null;
  };
  soilSamples: {
    items: SoilSample[];
    loading: boolean;
    error: string | null;
  };
  grazingPlans: {
    items: GrazingPlan[];
    loading: boolean;
    error: string | null;
  };
  weatherData: {
    items: WeatherData[];
    loading: boolean;
    error: string | null;
  };
  carbonSequestration: {
    items: CarbonSequestration[];
    loading: boolean;
    error: string | null;
  };
  soilHealthScores: {
    items: SoilHealthScore[];
    loading: boolean;
    error: string | null;
  };
  economicImpacts: {
    items: EconomicImpact[];
    loading: boolean;
    error: string | null;
  };
  currentPlan: GrazingPlan | null;
  offlineMode: boolean;
  loading: {
    pastures: boolean;
    events: boolean;
    plan: boolean;
  };
  error: {
    pastures: string | null;
    events: string | null;
    plan: string | null;
  };
}

export interface CreatePastureInput {
  name: string;
  size: number;
  location: Location;
  forageTypes: ForageType[];
  waterSources: WaterSource[];
  restPeriod: number;
  soilCondition: {
    ph: number;
    organicMatter: number;
    moisture: number;
  };
  forageCondition: {
    height: number;
    density: number;
    quality: number;
  };
  notes?: string;
}

export interface UpdatePastureInput {
  name?: string;
  size?: number;
  location?: Location;
  status?: PastureStatus;
  forageTypes?: ForageType[];
  waterSources?: WaterSource[];
  restPeriod?: number;
  soilCondition?: {
    ph?: number;
    organicMatter?: number;
    moisture?: number;
  };
  forageCondition?: {
    height?: number;
    density?: number;
    quality?: number;
  };
  notes?: string;
}

export interface CreateGrazingPlanInput {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  rotations: Omit<RotationEntry, 'id' | 'pastureName'>[];
}

export interface UpdateGrazingPlanInput {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  rotations?: Omit<RotationEntry, 'id' | 'pastureName'>[];
  status?: 'draft' | 'active' | 'completed' | 'cancelled';
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
  elevation?: number; // Optional elevation in meters
}

export interface GrazingEvent {
  id: string;
  pastureId: string;
  type: GrazingEventType;
  status: GrazingEventStatus;
  date: string;
  notes: string;
  metrics: {
    duration: number;
    cattleCount: number;
    forageUtilization: number;
  };
}

export interface ForageMeasurement {
  id: string;
  pastureId: string;
  date: Date;
  measurements: {
    height: number; // in centimeters
    density: number; // in kg/ha
    species: {
      type: VegetationType;
      percentage: number;
    }[];
  };
  weatherConditions: WeatherCondition[];
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoilSample {
  id: string;
  pastureId: string;
  date: Date;
  location: GeoPoint;
  depth: number; // in centimeters
  metrics: {
    ph: number;
    organicMatter: number; // percentage
    nitrogen: number; // mg/kg
    phosphorus: number; // mg/kg
    potassium: number; // mg/kg
    carbon: number; // percentage
    bulkDensity: number; // g/cm³
    waterHoldingCapacity: number; // percentage
  };
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeatherData {
  id: string;
  date: Date;
  location: GeoPoint;
  conditions: WeatherCondition[];
  temperature: {
    min: number;
    max: number;
    current: number;
  };
  precipitation: number; // in mm
  humidity: number; // percentage
  windSpeed: number; // km/h
  windDirection: number; // degrees
  solarRadiation?: number; // W/m²
  createdAt: Date;
  updatedAt: Date;
}

export interface CarbonSequestration {
  id: string;
  pastureId: string;
  date: Date;
  metrics: {
    aboveGroundBiomass: number; // tons/ha
    belowGroundBiomass: number; // tons/ha
    soilOrganicCarbon: number; // tons/ha
    totalSequestration: number; // tons CO2e/ha
  };
  methodology: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoilHealthScore {
  id: string;
  pastureId: string;
  date: Date;
  score: number; // 0-100
  components: {
    organicMatter: number;
    biologicalActivity: number;
    waterInfiltration: number;
    aggregateStability: number;
    nutrientCycling: number;
  };
  recommendations?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EconomicImpact {
  id: string;
  pastureId: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    forageProduction: number; // tons
    grazingDays: number;
    animalWeightGain: number; // kg
    inputCosts: number;
    outputValue: number;
    netBenefit: number;
  };
  analysis: {
    returnOnInvestment: number;
    costPerKgGain: number;
    profitPerHectare: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type GrazingEventType = 'start' | 'end' | 'rotation' | 'maintenance';
export type GrazingEventStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'; 