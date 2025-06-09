import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

interface SummaryCardProps {
  income: number;
  expenses: number;
  balance: number;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ income, expenses, balance }) => {
  const { t, i18n } = useTranslation();
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Icon name="arrow-down-bold-circle" size={24} color="#4CAF50" />
        <Text style={styles.label}>{t('financial.summary.income')}</Text>
        <Text style={[styles.amount, { color: '#4CAF50' }]}>{formatAmount(income)}</Text>
      </View>
      <View style={styles.card}>
        <Icon name="arrow-up-bold-circle" size={24} color="#F44336" />
        <Text style={styles.label}>{t('financial.summary.expenses')}</Text>
        <Text style={[styles.amount, { color: '#F44336' }]}>{formatAmount(expenses)}</Text>
      </View>
      <View style={styles.card}>
        <Icon name="bank" size={24} color={balance >= 0 ? '#4CAF50' : '#F44336'} />
        <Text style={styles.label}>{t('financial.summary.balance')}</Text>
        <Text style={[styles.amount, { color: balance >= 0 ? '#4CAF50' : '#F44336' }]}>{formatAmount(balance)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  card: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
}); 