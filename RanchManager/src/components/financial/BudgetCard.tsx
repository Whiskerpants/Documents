import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { BudgetProgressBar } from './BudgetProgressBar';
import { formatCurrency } from '../../utils/formatters';
import { Budget } from '../../store/types/financial';

interface BudgetCardProps {
  budget: Budget;
  style?: ViewStyle;
  onPress?: () => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  budget,
  style,
  onPress,
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('BudgetDetail', { budgetId: budget.id });
    }
  };

  const handleEdit = () => {
    navigation.navigate('AddEditBudget', { budgetId: budget.id });
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? '#4CAF50' : '#9E9E9E';
  };

  const getTopCategories = () => {
    return Object.entries(budget.categoryAllocations)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{budget.name}</Text>
          <Text style={styles.period}>
            {budget.periodType === 'monthly'
              ? new Date(budget.startDate).toLocaleDateString(t('common.locale'), {
                  month: 'long',
                  year: 'numeric',
                })
              : t('budget.quarter', {
                  quarter: Math.floor(new Date(budget.startDate).getMonth() / 3) + 1,
                  year: new Date(budget.startDate).getFullYear(),
                })}
          </Text>
        </View>
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: getStatusColor(budget.isActive) },
          ]}
        />
      </View>

      <View style={styles.progressSection}>
        <BudgetProgressBar
          spent={budget.spent}
          total={budget.total}
          size="md"
        />
      </View>

      <View style={styles.categoriesSection}>
        {getTopCategories().map(([category, allocated]) => {
          const spent = budget.categorySpent[category] || 0;
          return (
            <View key={category} style={styles.categoryItem}>
              <Text style={styles.categoryName}>{category}</Text>
              <BudgetProgressBar
                spent={spent}
                total={allocated}
                size="sm"
                showAmount={false}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <View style={styles.amounts}>
          <Text style={styles.amountLabel}>{t('budget.allocated')}</Text>
          <Text style={styles.amountValue}>{formatCurrency(budget.total)}</Text>
        </View>
        <View style={styles.amounts}>
          <Text style={styles.amountLabel}>{t('budget.spent')}</Text>
          <Text style={styles.amountValue}>{formatCurrency(budget.spent)}</Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEdit}
        >
          <Text style={styles.editButtonText}>{t('common.edit')}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  period: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressSection: {
    marginBottom: 16,
  },
  categoriesSection: {
    marginBottom: 16,
  },
  categoryItem: {
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  amounts: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    color: '#666',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    backgroundColor: '#3B7302',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
}); 