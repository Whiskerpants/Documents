import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HealthSeverity } from '../../store/types/health';
import { useTranslation } from 'react-i18next';

interface HealthStatusBadgeProps {
  severity: HealthSeverity;
  size?: 'small' | 'medium' | 'large';
}

const getSeverityColor = (severity: HealthSeverity): string => {
  switch (severity) {
    case HealthSeverity.Critical:
      return '#DC2626'; // Red
    case HealthSeverity.High:
      return '#F59E0B'; // Amber
    case HealthSeverity.Medium:
      return '#3B82F6'; // Blue
    case HealthSeverity.Low:
      return '#10B981'; // Green
    default:
      return '#6B7280'; // Gray
  }
};

const getSeverityText = (severity: HealthSeverity): string => {
  switch (severity) {
    case HealthSeverity.Critical:
      return 'Critical';
    case HealthSeverity.High:
      return 'High';
    case HealthSeverity.Medium:
      return 'Medium';
    case HealthSeverity.Low:
      return 'Low';
    default:
      return 'Unknown';
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

export const HealthStatusBadge: React.FC<HealthStatusBadgeProps> = ({ severity, size = 'medium' }) => {
  const { t } = useTranslation();
  const color = getSeverityColor(severity);
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
        {t(`health.severity.${severity.toLowerCase()}`)}
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