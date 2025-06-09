import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootState } from '../../store/store';
import { TransactionCategory } from '../../store/types/financial';

interface EntityFinancialCardProps {
  entityId: string;
  entityType: 'cattle' | 'group';
  period: 'month' | 'quarter' | 'year' | 'lifetime';
  onPeriodChange: (period: 'month' | 'quarter' | 'year' | 'lifetime') => void;
}

export const EntityFinancialCard: React.FC<EntityFinancialCardProps> = ({
  entityId,
  entityType,
  period,
  onPeriodChange,
}) => {
  const { t } = useTranslation();

  const transactions = useSelector((state: RootState) =>
    state.financial.transactions.items.filter(
      (t) => t.relatedEntityId === entityId
    )
  );

  const calculateMetrics = useCallback(() => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'lifetime':
        startDate = new Date(0);
        break;
    }

    const filteredTransactions = transactions.filter(
      (t) => new Date(t.date) >= startDate
    );

    const income = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const profit = income - expenses;
    const roi = expenses > 0 ? (profit / expenses) * 100 : 0;

    return {
      income,
      expenses,
      profit,
      roi,
      transactionCount: filteredTransactions.length,
    };
  }, [transactions, period]);

  const metrics = calculateMetrics();

  const getTrendIndicator = () => {
    if (metrics.profit > 0) {
      return (
        <View style={[styles.trendIndicator, styles.trendUp]}>
          <Icon name="trending-up" size={16} color="#4CAF50" />
        </View>
      );
    } else if (metrics.profit < 0) {
      return (
        <View style={[styles.trendIndicator, styles.trendDown]}>
          <Icon name="trending-down" size={16} color="#F44336" />
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {t(`entity.${entityType}.financialSummary`)}
        </Text>
        <View style={styles.periodSelector}>
          {(['month', 'quarter', 'year', 'lifetime'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodButton, period === p && styles.periodButtonActive]}
              onPress={() => onPeriodChange(p)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  period === p && styles.periodButtonTextActive,
                ]}
              >
                {t(`period.${p}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.metrics}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>{t('financial.income')}</Text>
          <Text style={styles.metricValue}>
            {t('common.currency', {
              value: metrics.income,
              currency: 'USD',
            })}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>{t('financial.expenses')}</Text>
          <Text style={styles.metricValue}>
            {t('common.currency', {
              value: metrics.expenses,
              currency: 'USD',
            })}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>{t('financial.profit')}</Text>
          <View style={styles.profitContainer}>
            <Text
              style={[
                styles.metricValue,
                metrics.profit >= 0 ? styles.profit : styles.loss,
              ]}
            >
              {t('common.currency', {
                value: metrics.profit,
                currency: 'USD',
              })}
            </Text>
            {getTrendIndicator()}
          </View>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>{t('financial.roi')}</Text>
          <Text
            style={[
              styles.metricValue,
              metrics.roi >= 0 ? styles.profit : styles.loss,
            ]}
          >
            {metrics.roi.toFixed(1)}%
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  periodButtonActive: {
    backgroundColor: '#3B7302',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#FFF',
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricItem: {
    flex: 1,
    minWidth: '45%',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  profitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendIndicator: {
    padding: 4,
    borderRadius: 4,
  },
  trendUp: {
    backgroundColor: '#E8F5E9',
  },
  trendDown: {
    backgroundColor: '#FFEBEE',
  },
  profit: {
    color: '#4CAF50',
  },
  loss: {
    color: '#F44336',
  },
}); 