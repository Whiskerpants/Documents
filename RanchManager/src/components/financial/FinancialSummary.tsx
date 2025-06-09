import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FinancialSummary as FinancialSummaryType } from '../../store/types/financial';

interface FinancialSummaryProps {
  summary: FinancialSummaryType;
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  summary,
}) => {
  const { t } = useTranslation();

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getProfitColor = (amount: number) => {
    if (amount > 0) return '#4CAF50';
    if (amount < 0) return '#F44336';
    return '#666';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {t('financial.summary.title')}
        </Text>
        <TouchableOpacity style={styles.exportButton}>
          <Icon name="export" size={20} color="#3B7302" />
          <Text style={styles.exportButtonText}>
            {t('common.export')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cards}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="arrow-down-bold-circle" size={24} color="#4CAF50" />
            <Text style={styles.cardTitle}>
              {t('financial.summary.income')}
            </Text>
          </View>
          <Text style={[styles.amount, { color: '#4CAF50' }]}>
            {formatAmount(summary.totalIncome)}
          </Text>
          <Text style={styles.period}>
            {t('financial.summary.thisMonth')}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="arrow-up-bold-circle" size={24} color="#F44336" />
            <Text style={styles.cardTitle}>
              {t('financial.summary.expenses')}
            </Text>
          </View>
          <Text style={[styles.amount, { color: '#F44336' }]}>
            {formatAmount(summary.totalExpenses)}
          </Text>
          <Text style={styles.period}>
            {t('financial.summary.thisMonth')}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="chart-line" size={24} color="#2196F3" />
            <Text style={styles.cardTitle}>
              {t('financial.summary.profit')}
            </Text>
          </View>
          <Text
            style={[
              styles.amount,
              { color: getProfitColor(summary.netProfit) },
            ]}
          >
            {formatAmount(summary.netProfit)}
          </Text>
          <Text style={styles.period}>
            {t('financial.summary.thisMonth')}
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>
            {t('financial.summary.avgTransaction')}
          </Text>
          <Text style={styles.statValue}>
            {formatAmount(summary.averageTransactionAmount)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>
            {t('financial.summary.transactionCount')}
          </Text>
          <Text style={styles.statValue}>
            {summary.transactionCount}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>
            {t('financial.summary.profitMargin')}
          </Text>
          <Text style={styles.statValue}>
            {summary.profitMargin.toFixed(1)}%
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportButtonText: {
    fontSize: 14,
    color: '#3B7302',
    marginLeft: 8,
  },
  cards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  amount: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  period: {
    fontSize: 12,
    color: '#666',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
}); 