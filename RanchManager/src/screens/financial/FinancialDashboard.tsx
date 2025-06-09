import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Dimensions,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootState } from '../../store/store';
import {
  FinancialSummary,
  TransactionCategory,
  TransactionType,
  Budget,
  Report,
  Transaction,
} from '../../store/types/financial';
import { fetchTransactions, fetchBudgets } from '../../store/actions/financial';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Card } from '../common';
import { FinancialInsights } from './components/FinancialInsights';

const PRIMARY = '#3B7302';
const screenWidth = Dimensions.get('window').width;

export const FinancialDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();

  // Date range for summary metrics
  const [dateRange, setDateRange] = useState<{
    start: Date;
    end: Date;
  }>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date(),
  });

  // Animation for cards
  const fadeAnim = new Animated.Value(0);

  // Redux state
  const transactionsState = useSelector((state: RootState) => state.financial.transactions);
  const budgetsState = useSelector((state: RootState) => state.financial.budgets);
  const summaryState = useSelector((state: RootState) => state.financial.summary);

  const loading = transactionsState.loading || budgetsState.loading || summaryState.loading;
  const error = transactionsState.error || budgetsState.error || summaryState.error;

  // Derived data
  const recentTransactions = transactionsState.items
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  const activeBudgets = budgetsState.items.filter((b) => b.isActive);
  const summary: FinancialSummary | null = summaryState.current;

  // Health indicators
  const profitMargin = summary && summary.totalIncome > 0
    ? (summary.netProfit / summary.totalIncome) * 100
    : 0;
  const expenseRatio = summary && summary.totalIncome > 0
    ? (summary.totalExpenses / summary.totalIncome) * 100
    : 0;

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch<any>(fetchTransactions()),
      dispatch<any>(fetchBudgets()),
      // Optionally: dispatch(fetchSummary())
    ]);
    setRefreshing(false);
  }, [dispatch]);

  // Animation effect
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Initial data fetch
  useEffect(() => {
    handleRefresh();
  }, []);

  // Date formatting
  const formatDate = (date: Date) =>
    format(date, 'PPP', { locale: i18n.language === 'es' ? es : enUS });

  // Empty state
  const isEmpty =
    (!summary || (summary.totalIncome === 0 && summary.totalExpenses === 0)) &&
    recentTransactions.length === 0 &&
    activeBudgets.length === 0;

  // Quick actions
  const quickActions = [
    {
      icon: 'plus-circle',
      label: t('financial.dashboard.addTransaction'),
      onPress: () => navigation.navigate('AddEditTransaction'),
    },
    {
      icon: 'file-document',
      label: t('financial.dashboard.reports'),
      onPress: () => navigation.navigate('Reports'),
    },
    {
      icon: 'wallet',
      label: t('financial.dashboard.budgets'),
      onPress: () => navigation.navigate('BudgetList'),
    },
    {
      icon: 'account-group',
      label: t('financial.dashboard.entityProfitability'),
      onPress: () => navigation.navigate('EntityProfitability'),
    },
  ];

  // Overview cards data
  const overviewCards = [
    {
      icon: 'cash-plus',
      label: t('financial.dashboard.income'),
      value: summary ? summary.totalIncome : 0,
      color: PRIMARY,
    },
    {
      icon: 'cash-minus',
      label: t('financial.dashboard.expenses'),
      value: summary ? summary.totalExpenses : 0,
      color: '#BA1A1A',
    },
    {
      icon: 'cash-multiple',
      label: t('financial.dashboard.profit'),
      value: summary ? summary.netProfit : 0,
      color: summary && summary.netProfit >= 0 ? PRIMARY : '#BA1A1A',
    },
  ];

  // Renderers
  const renderOverviewCard = (card: any, idx: number) => (
    <Animated.View
      key={card.label}
      style={{
        ...styles.overviewCard,
        backgroundColor: '#F5F5F5',
        borderColor: card.color,
        opacity: fadeAnim,
        transform: [{ scale: fadeAnim }],
      }}
    >
      <Icon name={card.icon} size={32} color={card.color} style={{ marginBottom: 8 }} />
      <Text style={[styles.overviewLabel, { color: colors.text }]}>{card.label}</Text>
      <Text style={[styles.overviewValue, { color: card.color }]}>
        {card.value.toLocaleString(i18n.language, { style: 'currency', currency: 'USD' })}
      </Text>
    </Animated.View>
  );

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => navigation.navigate('TransactionDetail', { transactionId: item.id })}
    >
      <Icon
        name={item.type === TransactionType.Income ? 'arrow-down-bold-circle' : 'arrow-up-bold-circle'}
        size={24}
        color={item.type === TransactionType.Income ? PRIMARY : '#BA1A1A'}
        style={{ marginRight: 12 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.transactionDesc} numberOfLines={1}>{item.description}</Text>
        <Text style={styles.transactionDate}>{formatDate(new Date(item.date))}</Text>
      </View>
      <Text
        style={[
          styles.transactionAmount,
          { color: item.type === TransactionType.Income ? PRIMARY : '#BA1A1A' },
        ]}
      >
        {(item.type === TransactionType.Income ? '+' : '-') +
          item.amount.toLocaleString(i18n.language, { style: 'currency', currency: 'USD' })}
      </Text>
    </TouchableOpacity>
  );

  const renderBudget = (budget: Budget) => {
    const progress = budget.total > 0 ? (budget.spent / budget.total) * 100 : 0;
    return (
      <TouchableOpacity
        key={budget.id}
        style={styles.budgetItem}
        onPress={() => navigation.navigate('BudgetDetail', { budgetId: budget.id })}
      >
        <Text style={styles.budgetName}>{budget.name}</Text>
        <View style={styles.budgetProgressBarBg}>
          <View style={[styles.budgetProgressBar, { width: `${Math.min(progress, 100)}%` }]} />
        </View>
        <Text style={styles.budgetProgressText}>
          {t('financial.dashboard.budgetProgress', {
            spent: budget.spent.toLocaleString(i18n.language, { style: 'currency', currency: 'USD' }),
            total: budget.total.toLocaleString(i18n.language, { style: 'currency', currency: 'USD' })
          })}
        </Text>
      </TouchableOpacity>
    );
  };

  // Main render
  return (
    <ScrollView style={styles.container}>
      {/* Date Range Selector */}
      <View style={styles.dateRangeContainer}>
        <Text style={styles.sectionTitle}>{t('financial.dashboard.dateRange')}</Text>
        <View style={styles.dateRangeRow}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {/* TODO: Show date picker */}}
          >
            <Text style={styles.dateButtonText}>{formatDate(dateRange.start)}</Text>
          </TouchableOpacity>
          <Text style={styles.dateRangeDash}>-</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {/* TODO: Show date picker */}}
          >
            <Text style={styles.dateButtonText}>{formatDate(dateRange.end)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Overview Cards */}
      <View style={styles.overviewCardsRow}>
        {overviewCards.map(renderOverviewCard)}
      </View>

      {/* Health Indicators */}
      <View style={styles.healthIndicators}>
        <View style={styles.healthIndicator}>
          <Text style={styles.healthLabel}>{t('financial.dashboard.profitMargin')}</Text>
          <Text style={[styles.healthValue, { color: profitMargin >= 0 ? PRIMARY : '#BA1A1A' }]}> 
            {profitMargin.toFixed(1)}%
          </Text>
        </View>
        <View style={styles.healthIndicator}>
          <Text style={styles.healthLabel}>{t('financial.dashboard.expenseRatio')}</Text>
          <Text style={[styles.healthValue, { color: '#BA1A1A' }]}> 
            {expenseRatio.toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsRow}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.quickAction}
            onPress={action.onPress}
          >
            <Icon name={action.icon} size={28} color={PRIMARY} />
            <Text style={styles.quickActionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('financial.dashboard.recentTransactions')}</Text>
        {recentTransactions.length === 0 ? (
          <Text style={styles.emptyText}>{t('financial.dashboard.noTransactions')}</Text>
        ) : (
          <FlatList
            data={recentTransactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
        <TouchableOpacity
          style={styles.seeAllButton}
          onPress={() => navigation.navigate('TransactionList')}
        >
          <Text style={styles.seeAllText}>{t('financial.dashboard.seeAllTransactions')}</Text>
          <Icon name="chevron-right" size={20} color={PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Active Budgets */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('financial.dashboard.activeBudgets')}</Text>
        {activeBudgets.length === 0 ? (
          <Text style={styles.emptyText}>{t('financial.dashboard.noBudgets')}</Text>
        ) : (
          <View>
            {activeBudgets.slice(0, 3).map(renderBudget)}
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => navigation.navigate('BudgetList')}
            >
              <Text style={styles.seeAllText}>{t('financial.dashboard.seeAllBudgets')}</Text>
              <Icon name="chevron-right" size={20} color={PRIMARY} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('financial.dashboard.totalIncome')}</Text>
          <Text style={[styles.summaryAmount, { color: colors.primary }]}>
            {summary.totalIncome.toLocaleString(undefined, {
              style: 'currency',
              currency: 'USD',
            })}
          </Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('financial.dashboard.totalExpenses')}</Text>
          <Text style={[styles.summaryAmount, { color: colors.notification }]}>
            {summary.totalExpenses.toLocaleString(undefined, {
              style: 'currency',
              currency: 'USD',
            })}
          </Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('financial.dashboard.netProfit')}</Text>
          <Text style={[
            styles.summaryAmount,
            { color: summary.netProfit >= 0 ? colors.primary : colors.notification }
          ]}>
            {summary.netProfit.toLocaleString(undefined, {
              style: 'currency',
              currency: 'USD',
            })}
          </Text>
        </Card>
      </View>

      {/* Insights Section */}
      <FinancialInsights />

      {/* Error/Loading/Empty States */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      )}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('financial.dashboard.error')}</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {isEmpty && !loading && !error && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('financial.dashboard.empty')}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  dateRangeContainer: {
    marginBottom: 16,
  },
  dateRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dateButtonText: {
    fontSize: 14,
    color: PRIMARY,
  },
  dateRangeDash: {
    fontSize: 18,
    marginHorizontal: 8,
    color: '#888',
  },
  overviewCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  overviewCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginHorizontal: 2,
  },
  overviewLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  healthIndicators: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  healthIndicator: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  healthLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  healthValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 2,
  },
  quickActionLabel: {
    fontSize: 12,
    marginTop: 4,
    color: PRIMARY,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: PRIMARY,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.41,
  },
  transactionDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  transactionDate: {
    fontSize: 12,
    color: '#888',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  seeAllText: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  budgetItem: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.41,
  },
  budgetName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  budgetProgressBarBg: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  budgetProgressBar: {
    height: 8,
    backgroundColor: PRIMARY,
    borderRadius: 4,
  },
  budgetProgressText: {
    fontSize: 12,
    color: '#888',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
  },
  errorText: {
    color: '#BA1A1A',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  summaryCard: {
    flex: 1,
    minWidth: 150,
  },
  summaryTitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
}); 