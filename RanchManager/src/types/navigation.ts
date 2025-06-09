import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Dashboard: undefined;
  AddCattle: undefined;
  HealthCheck: undefined;
  WeightRecord: undefined;
  HealthAlerts: undefined;
  Activities: undefined;
  CattleDetails: { cattleId: string };
  AddEditCattle: { cattleId?: string };
};

export type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

export interface CattleDetailScreenRouteProp {
  params: {
    cattleId: string;
  };
} 