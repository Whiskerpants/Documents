import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';
import { Transaction, TransactionType } from '../../store/types/financial';

interface TransactionItemProps {
  transaction: Transaction;
  onPress: () => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onPress,
}) => {
  const { t } = useTranslation();

  const getTransactionIcon = () => {
    switch (transaction.type) {
      case TransactionType.INCOME:
        return 'arrow-down-bold-circle';
      case TransactionType.EXPENSE:
        return 'arrow-up-bold-circle';
      case TransactionType.TRANSFER:
        return 'swap-horizontal-circle';
      default:
        return 'cash-multiple';
    }
  };

  const getTransactionColor = () => {
    switch (transaction.type) {
      case TransactionType.INCOME:
        return '#4CAF50';
      case TransactionType.EXPENSE:
        return '#F44336';
      case TransactionType.TRANSFER:
        return '#2196F3';
      default:
        return '#666';
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Icon
          name={getTransactionIcon()}
          size={24}
          color={getTransactionColor()}
        />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {transaction.description}
          </Text>
          <Text
            style={[
              styles.amount,
              { color: getTransactionColor() },
            ]}
          >
            {formatAmount(transaction.amount)}
          </Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.category}>
            {t(`financial.categories.${transaction.category}`)}
          </Text>
          <Text style={styles.date}>
            {format(new Date(transaction.date), 'MMM d, yyyy')}
          </Text>
        </View>
        {transaction.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            {transaction.notes}
          </Text>
        )}
        {transaction.tags && transaction.tags.length > 0 && (
          <View style={styles.tags}>
            {transaction.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <Icon
        name="chevron-right"
        size={24}
        color="#666"
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  notes: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#3B7302',
  },
  chevron: {
    marginLeft: 8,
  },
}); 