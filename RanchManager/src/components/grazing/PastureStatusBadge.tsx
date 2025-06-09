import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PastureStatus } from '../../store/types/grazing';
import { useTranslation } from 'react-i18next';

interface PastureStatusBadgeProps {
  status: PastureStatus;
  size?: 'small' | 'medium' | 'large';
}

const getStatusColor = (status: PastureStatus): string => {
  switch (status) {
    case PastureStatus.Available:
      return '#10B981'; // Green
    case PastureStatus.Active:
      return '#3B82F6'; // Blue
    case PastureStatus.Resting:
      return '#F59E0B'; // Amber
    case PastureStatus.Maintenance:
      return '#DC2626'; // Red
    default:
      return '#6B7280'; // Gray
  }
};

const getBadgeSize = (size: 'small' | 'medium' | 'large' = 'medium') => {
  switch (size) {
    case 'small':
      return {
        padding: 4,
        fontSize: 12,
        borderRadius: 4,
      };
    case 'large':
      return {
        padding: 8,
        fontSize: 16,
        borderRadius: 8,
      };
    default:
      return {
        padding: 6,
        fontSize: 14,
        borderRadius: 6,
      };
  }
};

export const PastureStatusBadge: React.FC<PastureStatusBadgeProps> = ({
  status,
  size = 'medium',
}) => {
  const { t } = useTranslation();
  const color = getStatusColor(status);
  const { padding, fontSize, borderRadius } = getBadgeSize(size);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${color}15`,
          borderColor: color,
          padding,
          borderRadius,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color,
            fontSize,
          },
        ]}
      >
        {t(`grazing.status.${status.toLowerCase()}`)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
}); 