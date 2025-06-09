import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Text,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { useTheme } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store/store';
import {
  fetchCattle,
  fetchGroups,
  calculateFinancialSummaries,
} from '../../store/actions/cattleActions';
import { fetchTransactions } from '../../store/actions/financialActions';
import { Cattle, CattleGroup, CattleFinancialSummary } from '../../store/types/cattle';
import { Transaction, TransactionCategory } from '../../store/types/financial';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useWindowDimensions } from 'react-native';

type TimePeriod = 'month' | 'quarter' | 'year' | 'all';

interface SummaryCardProps {
  title: string;
  value: number;
  trend?: number;
  color: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, trend, color }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>{title}</Text>
      <Text style={[styles.summaryValue, { color }]}>
        {formatCurrency(value)}
      </Text>
      {trend !== undefined && (
        <Text style={[styles.summaryTrend, { color: trend >= 0 ? '#4CAF50' : '#F44336' }]}>
          {trend >= 0 ? '+' : ''}{trend}%
        </Text>
      )}
    </View>
  );
};

export const EntityProfitability: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { width } = useWindowDimensions();
  const [selectedEntityType, setSelectedEntityType] = useState<'cattle' | 'group'>('cattle');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('year');

  const {
    items: cattle,
    groups,
    financialSummaries,
    loading: cattleLoading,
  } = useSelector((state: RootState) => state.cattle);

  const {
    items: transactions,
    loading: transactionsLoading,
  } = useSelector((state: RootState) => state.financial.transactions);

  useEffect(() => {
    dispatch(fetchCattle());
    dispatch(fetchGroups());
    dispatch(fetchTransactions({}));
    dispatch(calculateFinancialSummaries());
  }, [dispatch]);

  const selectedEntity = selectedEntityType === 'cattle'
    ? cattle.find(c => c.id === selectedEntityId)
    : groups.find(g => g.id === selectedEntityId);

  const entityFinancialSummary = financialSummaries.find(
    summary => summary.cattleId === selectedEntityId
  );

  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    const now = new Date();
    let startDate: Date;

    switch (timePeriod) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0);
    }

    return transactionDate >= startDate && transactionDate <= now;
  });

  const generateProfitTrendData = () => {
    const months = 12;
    const data = {
      labels: Array.from({ length: months }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (months - 1 - i));
        return date.toLocaleDateString(t('common.locale'), { month: 'short' });
      }),
      datasets: [
        {
          data: Array.from({ length: months }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - (months - 1 - i));
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const monthTransactions = filteredTransactions.filter(t => {
              const transactionDate = new Date(t.date);
              return transactionDate >= monthStart && transactionDate <= monthEnd;
            });

            const income = monthTransactions
              .filter(t => t.type === 'income')
              .reduce((sum, t) => sum + t.amount, 0);

            const expenses = monthTransactions
              .filter(t => t.type === 'expense')
              .reduce((sum, t) => sum + t.amount, 0);

            return income - expenses;
          }),
        },
      ],
    };

    return data;
  };

  const generateCategoryBreakdownData = () => {
    const categoryTotals = filteredTransactions.reduce((acc, t) => {
      if (!acc[t.category]) {
        acc[t.category] = 0;
      }
      acc[t.category] += t.amount;
      return acc;
    }, {} as Record<TransactionCategory, number>);

    return {
      labels: Object.keys(categoryTotals),
      datasets: [
        {
          data: Object.values(categoryTotals),
        },
      ],
    };
  };

  if (cattleLoading || transactionsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const profitTrendData = generateProfitTrendData();
  const categoryBreakdownData = generateCategoryBreakdownData();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('financial.entityProfitability.title')}</Text>
        <View style={styles.segmentedButtons}>
          <TouchableOpacity
            style={[
              styles.segmentedButton,
              selectedEntityType === 'cattle' && styles.segmentedButtonActive,
            ]}
            onPress={() => setSelectedEntityType('cattle')}
          >
            <Text
              style={[
                styles.segmentedButtonText,
                selectedEntityType === 'cattle' && styles.segmentedButtonTextActive,
              ]}
            >
              {t('financial.entityProfitability.cattle')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentedButton,
              selectedEntityType === 'group' && styles.segmentedButtonActive,
            ]}
            onPress={() => setSelectedEntityType('group')}
          >
            <Text
              style={[
                styles.segmentedButtonText,
                selectedEntityType === 'group' && styles.segmentedButtonTextActive,
              ]}
            >
              {t('financial.entityProfitability.groups')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.summaryContainer}>
        {entityFinancialSummary && (
          <>
            <SummaryCard
              title={t('financial.entityProfitability.totalIncome')}
              value={entityFinancialSummary.totalIncome}
              color="#4CAF50"
            />
            <SummaryCard
              title={t('financial.entityProfitability.totalExpenses')}
              value={entityFinancialSummary.totalExpenses}
              color="#F44336"
            />
            <SummaryCard
              title={t('financial.entityProfitability.netProfit')}
              value={entityFinancialSummary.netProfit}
              color={entityFinancialSummary.netProfit >= 0 ? '#4CAF50' : '#F44336'}
            />
          </>
        )}
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>{t('financial.entityProfitability.profitTrend')}</Text>
        <LineChart
          data={profitTrendData}
          width={width - 32}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(59, 115, 2, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>{t('financial.entityProfitability.categoryBreakdown')}</Text>
        <PieChart
          data={categoryBreakdownData.datasets[0].data.map((value, index) => ({
            value,
            name: categoryBreakdownData.labels[index],
            color: `hsl(${(index * 360) / categoryBreakdownData.labels.length}, 70%, 50%)`,
            legendFontColor: '#7F7F7F',
            legendFontSize: 12,
          }))}
          width={width - 32}
          height={220}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="value"
          backgroundColor="transparent"
          paddingLeft="15"
          style={styles.chart}
        />
      </View>

      <View style={styles.transactionsCard}>
        <Text style={styles.chartTitle}>{t('financial.entityProfitability.recentTransactions')}</Text>
        {filteredTransactions.slice(0, 5).map(transaction => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View>
              <Text style={styles.transactionTitle}>{transaction.description}</Text>
              <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
            </View>
            <Text
              style={[
                styles.transactionAmount,
                { color: transaction.type === 'income' ? '#4CAF50' : '#F44336' },
              ]}
            >
              {transaction.type === 'income' ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  segmentedButtons: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  segmentedButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  segmentedButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentedButtonText: {
    textAlign: 'center',
    color: '#666',
  },
  segmentedButtonTextActive: {
    color: '#3B7302',
    fontWeight: 'bold',
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    minWidth: 150,
    margin: 4,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  summaryTrend: {
    fontSize: 12,
    marginTop: 4,
  },
  chartCard: {
    margin: 8,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  transactionsCard: {
    margin: 8,
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 