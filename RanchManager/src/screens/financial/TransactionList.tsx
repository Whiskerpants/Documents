import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootState, AppDispatch } from '../../store/store';
import { fetchTransactions } from '../../store/actions/financialActions';
import { Transaction, TransactionType, TransactionCategory, TransactionFilters } from '../../store/types/financial';
import { TransactionItem } from '../../components/financial/TransactionItem';
import { SummaryCard } from '../../components/financial/SummaryCard';
import { FilterModal } from '../../components/financial/FilterModal';

const TIME_PERIODS = ['day', 'week', 'month', 'year', 'all'] as const;
type TimePeriod = typeof TIME_PERIODS[number];

const getPeriodRange = (period: TimePeriod): { startDate?: Date; endDate?: Date } => {
  const now = new Date();
  switch (period) {
    case 'day':
      return { startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()), endDate: now };
    case 'week': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      return { startDate: new Date(now.setDate(diff)), endDate: new Date() };
    }
    case 'month':
      return { startDate: new Date(now.getFullYear(), now.getMonth(), 1), endDate: now };
    case 'year':
      return { startDate: new Date(now.getFullYear(), 0, 1), endDate: now };
    default:
      return {};
  }
};

export const TransactionList: React.FC = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  // @ts-ignore
  const navigation: any = useSelector(() => undefined) || { navigate: () => {} }; // TODO: Replace with useNavigation<YourStackType>()
  const [search, setSearch] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [activePeriod, setActivePeriod] = useState<TimePeriod>('month');
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({});

  const { items: transactions, loading, error, filters: currentFilters } = useSelector((state: RootState) => state.financial.transactions);

  // Summary metrics
  const summary = useMemo(() => {
    let income = 0, expenses = 0;
    transactions.forEach((tx) => {
      if (tx.type === TransactionType.Income) income += tx.amount;
      else expenses += tx.amount;
    });
    return { income, expenses, balance: income - expenses };
  }, [transactions]);

  // Filtered and searched transactions
  const filteredTransactions = useMemo(() => {
    let txs = [...transactions];
    if (search) {
      const q = search.toLowerCase();
      txs = txs.filter((tx) => tx.description.toLowerCase().includes(q));
    }
    // Sort by date, newest first
    txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return txs;
  }, [transactions, search]);

  // Fetch on mount and when filters/period change
  useEffect(() => {
    const periodRange = getPeriodRange(activePeriod);
    const allFilters = { ...currentFilters, ...periodRange };
    dispatch(fetchTransactions(allFilters));
  }, [dispatch, currentFilters, activePeriod]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const periodRange = getPeriodRange(activePeriod);
    const allFilters = { ...currentFilters, ...periodRange };
    await dispatch(fetchTransactions(allFilters));
    setRefreshing(false);
  }, [dispatch, currentFilters, activePeriod]);

  const handleFilterApply = (newFilters: TransactionFilters) => {
    setFilters(newFilters);
  };

  const handlePeriodChange = (period: TimePeriod) => {
    setActivePeriod(period);
  };

  const handleAddTransaction = () => {
    navigation.navigate('AddEditTransaction');
  };

  const handleTransactionPress = (transaction: Transaction) => {
    navigation.navigate('TransactionDetail', { transactionId: transaction.id });
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TransactionItem transaction={item} onPress={() => handleTransactionPress(item)} />
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Icon name="cash-multiple" size={48} color="#CCC" />
      <Text style={styles.emptyText}>{t('financial.transactions.empty')}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with summary cards */}
      <SummaryCard income={summary.income} expenses={summary.expenses} balance={summary.balance} />

      {/* Search bar and filter button */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('common.search')}
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilter(true)}>
          <Icon name="filter-variant" size={24} color="#3B7302" />
        </TouchableOpacity>
      </View>

      {/* Time period selector */}
      <View style={styles.periodRow}>
        {TIME_PERIODS.map((period) => (
          <TouchableOpacity
            key={period}
            style={[styles.periodButton, activePeriod === period && styles.periodButtonActive]}
            onPress={() => handlePeriodChange(period)}
          >
            <Text style={[styles.periodButtonText, activePeriod === period && styles.periodButtonTextActive]}>
              {t(`financial.periods.${period}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transaction list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B7302" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : filteredTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="cash-multiple" size={48} color="#CCC" />
          <Text style={styles.emptyText}>{t('financial.transactions.empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransaction}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3B7302"]} />}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleAddTransaction}>
        <Icon name="plus" size={24} color="#FFF" />
      </TouchableOpacity>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilter}
        filters={filters}
        onApply={handleFilterApply}
        onClose={() => setShowFilter(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFF',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  filterButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 8,
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  periodButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  periodButtonActive: {
    backgroundColor: '#3B7302',
  },
  periodButtonText: {
    color: '#666',
    fontSize: 14,
  },
  periodButtonTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B7302',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
}); 