import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { GrazingPlan } from '../../store/types/grazing';

interface GrazingPlanCardProps {
  plan: GrazingPlan;
  onPress: (plan: GrazingPlan) => void;
}

export const GrazingPlanCard: React.FC<GrazingPlanCardProps> = ({ plan, onPress }) => {
  const { t } = useTranslation();

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return '#10B981'; // Green
      case 'draft':
        return '#6B7280'; // Gray
      case 'completed':
        return '#3B82F6'; // Blue
      case 'cancelled':
        return '#DC2626'; // Red
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string): string => {
    return t(`grazing.plan.status.${status}`);
  };

  const getDuration = (startDate: Date, endDate: Date): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return t('grazing.plan.duration', { days: diffDays });
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(plan)}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{plan.name}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(plan.status)}15` },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(plan.status) },
              ]}
            >
              {getStatusText(plan.status)}
            </Text>
          </View>
        </View>
        <Icon name="chevron-right" size={24} color="#6B7280" />
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Icon name="calendar" size={20} color="#6B7280" />
          <Text style={styles.detailText}>
            {new Date(plan.startDate).toLocaleDateString()}
            {' - '}
            {new Date(plan.endDate).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Icon name="clock-outline" size={20} color="#6B7280" />
          <Text style={styles.detailText}>
            {getDuration(plan.startDate, plan.endDate)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Icon name="cow" size={20} color="#6B7280" />
          <Text style={styles.detailText}>
            {t('grazing.plan.cattleCount', { count: plan.cattleCount })}
          </Text>
        </View>

        {plan.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>{t('grazing.plan.notes')}</Text>
            <Text style={styles.notesText} numberOfLines={2}>
              {plan.notes}
            </Text>
          </View>
        )}

        <View style={styles.rotations}>
          <Text style={styles.rotationsTitle}>
            {t('grazing.plan.rotations')}
          </Text>
          {plan.rotations.map((rotation, index) => (
            <View key={index} style={styles.rotationItem}>
              <Text style={styles.rotationText}>
                {t('grazing.plan.rotation', {
                  number: index + 1,
                  pasture: rotation.pastureName,
                  days: Math.ceil(
                    (new Date(rotation.endDate).getTime() -
                      new Date(rotation.startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  ),
                })}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
  },
  notes: {
    marginTop: 8,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
  },
  rotations: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  rotationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  rotationItem: {
    marginBottom: 4,
  },
  rotationText: {
    fontSize: 14,
    color: '#6B7280',
  },
}); 