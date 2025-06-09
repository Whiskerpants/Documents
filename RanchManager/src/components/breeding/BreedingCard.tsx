import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Breeding } from '../../store/types/breeding';
import { BreedingStatusBadge } from './BreedingStatusBadge';

interface BreedingCardProps {
  breeding: Breeding;
  onPress: (breeding: Breeding) => void;
}

export const BreedingCard: React.FC<BreedingCardProps> = ({ breeding, onPress }) => {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(breeding)}
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          {t('breeding.card.title', {
            dam: breeding.damName,
            sire: breeding.sireName,
          })}
        </Text>
        <BreedingStatusBadge status={breeding.status} size="small" />
      </View>

      <View style={styles.details}>
        <View style={styles.row}>
          <Text style={styles.label}>{t('breeding.card.date')}</Text>
          <Text style={styles.value}>
            {format(breeding.breedingDate, 'MMM dd, yyyy')}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>{t('breeding.card.method')}</Text>
          <Text style={styles.value}>
            {t(`breeding.method.${breeding.method.toLowerCase()}`)}
          </Text>
        </View>

        {breeding.technician && (
          <View style={styles.row}>
            <Text style={styles.label}>{t('breeding.card.technician')}</Text>
            <Text style={styles.value}>{breeding.technician}</Text>
          </View>
        )}

        {breeding.location && (
          <View style={styles.row}>
            <Text style={styles.label}>{t('breeding.card.location')}</Text>
            <Text style={styles.value}>{breeding.location}</Text>
          </View>
        )}

        {breeding.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notes}>{breeding.notes}</Text>
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
    marginVertical: 8,
    marginHorizontal: 16,
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
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  details: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  notesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  notes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
}); 