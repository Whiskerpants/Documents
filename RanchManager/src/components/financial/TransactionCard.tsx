import React, { memo } from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Text } from '../../screens/common/Text';
import { Icon } from '../../screens/common/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { Transaction, TransactionType } from '../../store/types/financial';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';

interface TransactionCardProps {
  transaction: Transaction;
  style?: ViewStyle;
}

export const TransactionCard: React.FC<TransactionCardProps> = memo(({ transaction, style }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const isIncome = transaction.type === TransactionType.Income;
  const amountColor = isIncome ? colors.success : colors.error;

  return (
    <View style={[styles.container, { backgroundColor: colors.card }, style]}>
      <View style={styles.header}>
        <View style={styles.categoryContainer}>
          <Icon
            name={getCategoryIcon(transaction.category)}
            size={24}
            color={colors.primary}
          />
          <Text style={{ ...styles.category, color: colors.text }}>
            {t(`financial.categories.${transaction.category}`)}
          </Text>
        </View>
        <Text style={{ ...styles.amount, color: amountColor }}>
          {formatCurrency(transaction.amount)}
        </Text>
      </View>

      <Text style={{ ...styles.description, color: colors.text }}>
        {transaction.description}
      </Text>

      <View style={styles.footer}>
        <Text style={{ ...styles.date, color: colors.text }}>
          {formatDate(transaction.date)}
        </Text>
        {transaction.relatedEntityId && (
          <Text style={{ ...styles.entity, color: colors.text }}>
            {transaction.relatedEntityId}
          </Text>
        )}
      </View>
    </View>
  );
});

const getCategoryIcon = (category: string): string => {
  const iconMap: Record<string, string> = {
    Feed: 'food',
    Veterinary: 'medical-bag',
    Equipment: 'tools',
    Labor: 'account-group',
    Utilities: 'lightning-bolt',
    Transportation: 'truck',
    Marketing: 'bullhorn',
    Insurance: 'shield-check',
    Taxes: 'cash-multiple',
    BreedingServices: 'cow',
    MilkSales: 'bottle-wine',
    CattleSales: 'cow',
    Other: 'dots-horizontal',
  };

  return iconMap[category] || 'dots-horizontal';
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    opacity: 0.7,
  },
  entity: {
    fontSize: 12,
    opacity: 0.7,
  },
}); 