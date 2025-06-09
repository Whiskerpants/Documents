import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { HealthEventType } from '../../store/types/health';

interface HealthTypeIconProps {
  type: HealthEventType;
  size?: number;
  color?: string;
}

const getIconName = (type: HealthEventType): string => {
  switch (type) {
    case HealthEventType.Vaccination:
      return 'needle';
    case HealthEventType.Treatment:
      return 'medical-bag';
    case HealthEventType.Illness:
      return 'virus';
    case HealthEventType.Injury:
      return 'bandage';
    case HealthEventType.Checkup:
      return 'stethoscope';
    default:
      return 'medical';
  }
};

const getIconColor = (type: HealthEventType): string => {
  switch (type) {
    case HealthEventType.Vaccination:
      return '#3B82F6'; // Blue
    case HealthEventType.Treatment:
      return '#10B981'; // Green
    case HealthEventType.Illness:
      return '#DC2626'; // Red
    case HealthEventType.Injury:
      return '#F59E0B'; // Amber
    case HealthEventType.Checkup:
      return '#8B5CF6'; // Purple
    default:
      return '#6B7280'; // Gray
  }
};

export const HealthTypeIcon: React.FC<HealthTypeIconProps> = ({
  type,
  size = 24,
  color,
}) => {
  const iconName = getIconName(type);
  const iconColor = color || getIconColor(type);

  return (
    <View style={styles.container}>
      <Icon name={iconName} size={size} color={iconColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 