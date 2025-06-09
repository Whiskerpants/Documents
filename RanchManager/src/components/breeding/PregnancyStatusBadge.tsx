import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PregnancyStatus } from '../../store/types/breeding';

interface PregnancyStatusBadgeProps {
  status: PregnancyStatus;
  size?: 'small' | 'medium' | 'large';
}

export const PregnancyStatusBadge: React.FC<PregnancyStatusBadgeProps> = ({
  status,
  size = 'medium',
}) => {
  const { t } = useTranslation();

  const getStatusColor = () => {
    switch (status) {
      case PregnancyStatus.Confirmed:
        return '#4CAF50'; // Green
      case PregnancyStatus.DueSoon:
        return '#FFA500'; // Orange
      case PregnancyStatus.Overdue:
        return '#F44336'; // Red
      case PregnancyStatus.Completed:
        return '#2196F3'; // Blue
      case PregnancyStatus.Lost:
        return '#9E9E9E'; // Grey
      default:
        return '#757575'; // Default grey
    }
  };

  const getBadgeSize = () => {
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

  const badgeStyle = {
    ...styles.badge,
    backgroundColor: getStatusColor(),
    ...getBadgeSize(),
  };

  return (
    <View style={badgeStyle}>
      <Text style={[styles.text, { fontSize: getBadgeSize().fontSize }]}>
        {t(`breeding.pregnancy.status.${status.toLowerCase()}`)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
}); 