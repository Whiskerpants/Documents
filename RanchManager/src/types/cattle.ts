import { NavigationProps, CattleDetailScreenRouteProp } from './navigation';

export type Gender = 'male' | 'female';
export type HealthStatus = 'healthy' | 'sick' | 'underObservation';
export type CattleStatus = 'active' | 'inactive' | 'sold' | 'deceased';
export type CattleBreed = 'angus' | 'hereford' | 'brahman' | 'simmental' | 'charolais' | 'other';
export type WeightUnit = 'kg' | 'lb';

export interface Cattle {
  id: string;
  tagNumber: string;
  name: string;
  breed: CattleBreed;
  gender: Gender;
  birthDate: Date;
  weight: number;
  weightUnit: WeightUnit;
  status: CattleStatus;
  healthStatus: HealthStatus;
  location: string;
  notes?: string;
  photoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CattleFormData {
  tagNumber: string;
  name: string;
  breed: CattleBreed;
  gender: Gender;
  birthDate: Date;
  weight: number;
  weightUnit: WeightUnit;
  status: CattleStatus;
  location: string;
  notes?: string;
  photo?: string;
}

export interface CattleDetailScreenProps {
  route: CattleDetailScreenRouteProp;
  navigation: NavigationProps;
}

export interface AddEditCattleScreenProps {
  route: {
    params: {
      cattleId?: string;
    };
  };
  navigation: NavigationProps;
} 