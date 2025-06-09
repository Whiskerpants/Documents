import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BreedingStatus } from '../../store/types/breeding';

interface BreedingStatusBadgeProps {
  status: BreedingStatus;
  size?: 'small' | 'medium' | 'large';
}

export const BreedingStatusBadge: React.FC<BreedingStatusBadgeProps> = ({
  status,
  size = 'medium',
}) => {
  const { t } = useTranslation();

  const getStatusColor = () => {
    switch (status) {
      case BreedingStatus.Pending:
        return '#FFA500'; // Orange
      case BreedingStatus.Confirmed:
        return '#4CAF50'; // Green
      case BreedingStatus.Failed:
        return '#F44336'; // Red
      case BreedingStatus.Aborted:
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
        {t(`breeding.status.${status.toLowerCase()}`)}
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