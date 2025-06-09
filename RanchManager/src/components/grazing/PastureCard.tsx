import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { Pasture } from '../../store/types/grazing';
import { PastureStatusBadge } from './PastureStatusBadge';

interface PastureCardProps {
  pasture: Pasture;
  onPress: (pasture: Pasture) => void;
}

export const PastureCard: React.FC<PastureCardProps> = ({ pasture, onPress }) => {
  const { t } = useTranslation();

  const getForageTypesText = () => {
    if (!pasture.forageTypes?.length) return t('grazing.noForageTypes');
    return pasture.forageTypes.join(', ');
  };

  const getWaterSourcesText = () => {
    if (!pasture.waterSources?.length) return t('grazing.noWaterSources');
    return pasture.waterSources.map(source => source.type).join(', ');
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(pasture)}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{pasture.name}</Text>
          <PastureStatusBadge status={pasture.status} />
        </View>
        <Icon name="chevron-right" size={24} color="#6B7280" />
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Icon name="ruler" size={20} color="#6B7280" />
          <Text style={styles.detailText}>
            {t('grazing.size', { size: pasture.size })}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Icon name="grass" size={20} color="#6B7280" />
          <Text style={styles.detailText}>{getForageTypesText()}</Text>
        </View>

        <View style={styles.detailRow}>
          <Icon name="water" size={20} color="#6B7280" />
          <Text style={styles.detailText}>{getWaterSourcesText()}</Text>
        </View>

        {pasture.currentConditions && (
          <View style={styles.conditions}>
            <Text style={styles.conditionsTitle}>
              {t('grazing.currentConditions')}
            </Text>
            <View style={styles.conditionsGrid}>
              <View style={styles.conditionItem}>
                <Text style={styles.conditionLabel}>
                  {t('grazing.forageHeight')}
                </Text>
                <Text style={styles.conditionValue}>
                  {pasture.currentConditions.forageHeight} cm
                </Text>
              </View>
              <View style={styles.conditionItem}>
                <Text style={styles.conditionLabel}>
                  {t('grazing.forageDensity')}
                </Text>
                <Text style={styles.conditionValue}>
                  {pasture.currentConditions.forageDensity}%
                </Text>
              </View>
              <View style={styles.conditionItem}>
                <Text style={styles.conditionLabel}>
                  {t('grazing.soilMoisture')}
                </Text>
                <Text style={styles.conditionValue}>
                  {pasture.currentConditions.soilMoisture}%
                </Text>
              </View>
            </View>
          </View>
        )}

        {pasture.grazingHistory?.length > 0 && (
          <View style={styles.history}>
            <Text style={styles.historyTitle}>
              {t('grazing.lastGrazing')}
            </Text>
            <Text style={styles.historyText}>
              {new Date(pasture.grazingHistory[0].startDate).toLocaleDateString()}
              {' - '}
              {new Date(pasture.grazingHistory[0].endDate).toLocaleDateString()}
            </Text>
          </View>
        )}
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
  conditions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  conditionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  conditionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  conditionItem: {
    flex: 1,
    alignItems: 'center',
  },
  conditionLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  conditionValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  history: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  historyText: {
    fontSize: 14,
    color: '#6B7280',
  },
}); 