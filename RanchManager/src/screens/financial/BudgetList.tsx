import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store/store';
import { fetchBudgets } from '../../store/actions/financialActions';
import { BudgetCard } from '../../components/financial/BudgetCard';
import { Budget } from '../../store/types/financial';
import { formatCurrency } from '../../utils/formatters';
import { FinancialStackParamList } from '../../navigation/types';

type FilterType = 'all' | 'active' | 'inactive';

export const BudgetList: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NavigationProp<FinancialStackParamList>>();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const { items: budgets, loading } = useSelector((state: RootState) => state.financial.budgets);

  useEffect(() => {
    dispatch(fetchBudgets());
  }, [dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchBudgets());
    setRefreshing(false);
  }, [dispatch]);

  const handleCreateBudget = () => {
    navigation.navigate('AddEditBudget');
  };

  const filteredBudgets = budgets.filter((budget) => {
    const matchesSearch = budget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      budget.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && budget.isActive) ||
      (filter === 'inactive' && !budget.isActive);
    return matchesSearch && matchesFilter;
  });

  const totalBudgeted = filteredBudgets.reduce((sum, budget) => sum + budget.total, 0);
  const totalSpent = filteredBudgets.reduce((sum, budget) => sum + budget.spent, 0);
  const progress = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  const renderSummaryCard = (title: string, value: string, subtitle?: string) => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>{title}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      {subtitle && <Text style={styles.summarySubtitle}>{subtitle}</Text>}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B7302" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('budget.list.title')}</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateBudget}
        >
          <Text style={styles.createButtonText}>{t('budget.list.create')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryContainer}>
        {renderSummaryCard(
          t('budget.list.totalBudgeted'),
          formatCurrency(totalBudgeted)
        )}
        {renderSummaryCard(
          t('budget.list.totalSpent'),
          formatCurrency(totalSpent)
        )}
        {renderSummaryCard(
          t('budget.list.overallProgress'),
          `${Math.round(progress)}%`,
          t('budget.list.ofTotalBudget')
        )}
      </View>

      <View style={styles.filterContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('budget.list.searchPlaceholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <View style={styles.filterButtons}>
          {(['all', 'active', 'inactive'] as FilterType[]).map(filterType => (
            <TouchableOpacity
              key={filterType}
              style={[
                styles.filterButton,
                filter === filterType && styles.filterButtonActive,
              ]}
              onPress={() => setFilter(filterType)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === filterType && styles.filterButtonTextActive,
                ]}
              >
                {t(`budget.list.filter.${filterType}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredBudgets}
        renderItem={({ item }) => <BudgetCard budget={item} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery
                ? t('budget.list.noResults')
                : t('budget.list.noBudgets')}
            </Text>
          </View>
        }
      />
    </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#3B7302',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
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
    color: '#333',
    marginTop: 4,
  },
  summarySubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  filterContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  filterButtonActive: {
    backgroundColor: '#3B7302',
  },
  filterButtonText: {
    textAlign: 'center',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  list: {
    padding: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 