import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { format, differenceInDays } from 'date-fns';
import { Pregnancy } from '../../store/types/breeding';
import { PregnancyStatusBadge } from './PregnancyStatusBadge';

interface PregnancyCardProps {
  pregnancy: Pregnancy;
  onPress: (pregnancy: Pregnancy) => void;
}

export const PregnancyCard: React.FC<PregnancyCardProps> = ({ pregnancy, onPress }) => {
  const { t } = useTranslation();

  const getDaysUntilDue = () => {
    const today = new Date();
    return differenceInDays(pregnancy.expectedDueDate, today);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(pregnancy)}
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          {t('breeding.pregnancy.card.title', {
            dam: pregnancy.damName,
          })}
        </Text>
        <PregnancyStatusBadge status={pregnancy.status} size="small" />
      </View>

      <View style={styles.details}>
        <View style={styles.row}>
          <Text style={styles.label}>{t('breeding.pregnancy.card.confirmationDate')}</Text>
          <Text style={styles.value}>
            {format(pregnancy.confirmationDate, 'MMM dd, yyyy')}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>{t('breeding.pregnancy.card.expectedDueDate')}</Text>
          <Text style={styles.value}>
            {format(pregnancy.expectedDueDate, 'MMM dd, yyyy')}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>{t('breeding.pregnancy.card.daysUntilDue')}</Text>
          <Text style={[
            styles.value,
            getDaysUntilDue() <= 7 && styles.warningText,
            getDaysUntilDue() < 0 && styles.dangerText,
          ]}>
            {getDaysUntilDue()}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>{t('breeding.pregnancy.card.gestationPeriod')}</Text>
          <Text style={styles.value}>
            {t('breeding.pregnancy.card.days', { days: pregnancy.gestationPeriod })}
          </Text>
        </View>

        {pregnancy.pregnancyChecks.length > 0 && (
          <View style={styles.checksContainer}>
            <Text style={styles.checksTitle}>
              {t('breeding.pregnancy.card.recentChecks')}
            </Text>
            {pregnancy.pregnancyChecks.slice(0, 2).map((check) => (
              <View key={check.id} style={styles.checkRow}>
                <Text style={styles.checkDate}>
                  {format(check.date, 'MMM dd, yyyy')}
                </Text>
                <Text style={[
                  styles.checkResult,
                  check.result === 'positive' && styles.positiveResult,
                  check.result === 'negative' && styles.negativeResult,
                ]}>
                  {t(`breeding.pregnancy.check.result.${check.result}`)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {pregnancy.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notes}>{pregnancy.notes}</Text>
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
  warningText: {
    color: '#FFA500',
  },
  dangerText: {
    color: '#F44336',
  },
  checksContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  checksTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  checkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  checkDate: {
    fontSize: 14,
    color: '#666',
  },
  checkResult: {
    fontSize: 14,
    fontWeight: '500',
  },
  positiveResult: {
    color: '#4CAF50',
  },
  negativeResult: {
    color: '#F44336',
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