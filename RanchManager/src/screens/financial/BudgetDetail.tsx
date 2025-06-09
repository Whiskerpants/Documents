import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootState, AppDispatch } from '../../store/store';
import { BudgetProgressBar } from '../../components/financial/BudgetProgressBar';
import { Budget, TransactionCategory } from '../../store/types/financial';
import { deleteBudget } from '../../store/actions/financialActions';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FinancialStackParamList } from '../../navigation/FinancialNavigator';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { useWindowDimensions } from 'react-native';
import { fetchBudget } from '../../store/actions/financialActions';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface BudgetDetailProps {
  route: {
    params: {
      budgetId: string;
    };
  };
  navigation: NativeStackNavigationProp<FinancialStackParamList, 'BudgetDetail'>;
}

export const BudgetDetail: React.FC<BudgetDetailProps> = ({ route, navigation }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const route = useRoute();
  const { width } = useWindowDimensions();
  const [isDeleting, setIsDeleting] = useState(false);

  const budgetId = route.params?.budgetId;
  const budget = useSelector((state: RootState) =>
    state.financial.budgets.items.find(b => b.id === budgetId)
  );

  useEffect(() => {
    const loadBudget = async () => {
      try {
        await dispatch(fetchBudget(budgetId));
      } catch (error) {
        Alert.alert(
          t('common.error'),
          t('budget.detail.loadError')
        );
      }
    };

    loadBudget();
  }, [dispatch, budgetId]);

  const handleDelete = async () => {
    Alert.alert(
      t('budget.detail.deleteConfirm.title'),
      t('budget.detail.deleteConfirm.message'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await dispatch(deleteBudget(budgetId));
              navigation.goBack();
            } catch (error) {
              Alert.alert(
                t('common.error'),
                t('budget.detail.deleteError')
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    try {
      const message = `${budget.name}\n\n` +
        `${t('budget.detail.period')}: ${formatDate(budget.startDate)} - ${formatDate(budget.endDate)}\n` +
        `${t('budget.detail.total')}: ${formatCurrency(budget.total)}\n` +
        `${t('budget.detail.spent')}: ${formatCurrency(budget.spent)}\n` +
        `${t('budget.detail.remaining')}: ${formatCurrency(budget.total - budget.spent)}\n\n` +
        `${t('budget.detail.categories')}:\n` +
        Object.entries(budget.categoryAllocations)
          .map(([category, allocated]) => {
            const spent = budget.categorySpent[category] || 0;
            return `${category}: ${formatCurrency(spent)} / ${formatCurrency(allocated)}`;
          })
          .join('\n');

      await Share.share({
        message,
        title: budget.name,
      });
    } catch (error) {
      Alert.alert(
        t('common.error'),
        t('budget.detail.shareError')
      );
    }
  };

  const formatDate = (date: Date) => {
    return format(date, 'PPP', {
      locale: i18n.language === 'es' ? es : enUS,
    });
  };

  const getStatusColor = (budget: Budget) => {
    const now = new Date();
    if (now < budget.startDate) return '#2196F3'; // Upcoming
    if (now > budget.endDate) return '#9E9E9E'; // Inactive
    return '#4CAF50'; // Active
  };

  const getStatusText = (budget: Budget) => {
    const now = new Date();
    if (now < budget.startDate) return t('budget.status.upcoming');
    if (now > budget.endDate) return t('budget.status.inactive');
    return t('budget.status.active');
  };

  if (!budget) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B7302" />
      </View>
    );
  }

  const totalAllocated = Object.values(budget.categories).reduce(
    (sum, cat) => sum + (cat?.allocated || 0),
    0
  );
  const totalSpent = Object.values(budget.categories).reduce(
    (sum, cat) => sum + (cat?.spent || 0),
    0
  );

  const generateMonthlyData = () => {
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

            return Object.entries(budget.categorySpent)
              .filter(([category, spent]) => {
                const transactionDate = new Date(category);
                return transactionDate >= monthStart && transactionDate <= monthEnd;
              })
              .reduce((sum, [, spent]) => sum + spent, 0);
          }),
        },
      ],
    };

    return data;
  };

  const generateCategoryData = () => {
    return {
      labels: Object.keys(budget.categoryAllocations),
      datasets: [
        {
          data: Object.entries(budget.categoryAllocations).map(([category, allocated]) => {
            const spent = budget.categorySpent[category] || 0;
            return spent;
          }),
        },
      ],
    };
  };

  const monthlyData = generateMonthlyData();
  const categoryData = generateCategoryData();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{budget.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(budget) }]}>
          <Text style={styles.statusText}>{getStatusText(budget)}</Text>
        </View>
      </View>

      <View style={styles.dateRange}>
        <Text style={styles.dateText}>
          {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
        </Text>
      </View>

      <View style={styles.progressSection}>
        <Text style={styles.sectionTitle}>{t('budget.overallProgress')}</Text>
        <BudgetProgressBar
          spent={totalSpent}
          allocated={totalAllocated}
          size="large"
          showAmount
          showPercentage
        />
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('budget.detail.total')}</Text>
          <Text style={styles.summaryValue}>{formatCurrency(budget.total)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('budget.detail.spent')}</Text>
          <Text style={styles.summaryValue}>{formatCurrency(budget.spent)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('budget.detail.remaining')}</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(budget.total - budget.spent)}
          </Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>{t('budget.detail.monthlySpending')}</Text>
        <LineChart
          data={monthlyData}
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
        <Text style={styles.chartTitle}>{t('budget.detail.categoryBreakdown')}</Text>
        <PieChart
          data={categoryData.datasets[0].data.map((value, index) => ({
            value,
            name: categoryData.labels[index],
            color: `hsl(${(index * 360) / categoryData.labels.length}, 70%, 50%)`,
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

      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>{t('budget.categories')}</Text>
        {Object.entries(budget.categories).map(([category, data]) => {
          if (!data) return null;
          return (
            <View key={category} style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryName}>{t(`transaction.category.${category}`)}</Text>
                <Text style={styles.categoryAmount}>
                  {t('common.currency', {
                    value: data.spent,
                    currency: 'USD',
                  })}
                  {' / '}
                  {t('common.currency', {
                    value: data.allocated,
                    currency: 'USD',
                  })}
                </Text>
              </View>
              <BudgetProgressBar
                spent={data.spent}
                allocated={data.allocated}
                size="small"
              />
            </View>
          );
        })}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => navigation.navigate('AddEditBudget', { budgetId: budget.id })}
        >
          <Icon name="pencil" size={24} color="#FFF" />
          <Text style={styles.actionButtonText}>{t('common.edit')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Icon name="delete" size={24} color="#FFF" />
              <Text style={styles.actionButtonText}>{t('common.delete')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.shareButton}
        onPress={handleShare}
      >
        <Text style={styles.shareButtonText}>{t('budget.detail.share')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  dateRange: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  dateText: {
    fontSize: 16,
    color: '#666',
  },
  progressSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
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
  chartCard: {
    margin: 16,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  categoriesSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFF',
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    color: '#333',
  },
  categoryAmount: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  editButton: {
    backgroundColor: '#3B7302',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  shareButton: {
    margin: 16,
    marginBottom: 32,
    backgroundColor: '#3B7302',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
}); 