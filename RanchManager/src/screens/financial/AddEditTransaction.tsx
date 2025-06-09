import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';
import store, { RootState, AppDispatch } from '../../store/store';
import {
  createTransaction,
  updateTransaction,
  fetchTransactions,
} from '../../store/actions/financialActions';
import {
  Transaction,
  TransactionType,
  TransactionCategory,
} from '../../store/types/financial';
import { DateRangePicker } from '../../components/common/DateRangePicker';
import { MultiSelect } from '../../components/common/MultiSelect';

type RouteParams = {
  transactionId?: string;
};

export const AddEditTransaction: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const transactionId = route.params?.transactionId;
  const isEditing = !!transactionId;

  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: TransactionType.Expense,
    category: TransactionCategory.OtherExpense,
    amount: 0,
    description: '',
    date: new Date(),
    tags: [],
  });

  useEffect(() => {
    if (isEditing) {
      loadTransaction();
    }
  }, [transactionId]);

  const loadTransaction = async () => {
    try {
      setLoading(true);
      await dispatch(fetchTransactions({}));
      const transaction = useSelector((state: RootState) =>
        state.financial.transactions.items.find((t) => t.id === transactionId)
      );
      if (transaction) {
        setFormData(transaction);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading transaction:', error);
      setLoading(false);
      Alert.alert(
        t('common.error'),
        t('financial.transactions.loadError')
      );
    }
  };

  const handleSave = async () => {
    if (!formData.amount || !formData.description) {
      Alert.alert(
        t('common.error'),
        t('financial.transactions.requiredFields')
      );
      return;
    }

    try {
      setSaving(true);
      if (isEditing && transactionId) {
        const updatedTransaction: Transaction = {
          id: transactionId,
          date: formData.date || new Date(),
          amount: formData.amount || 0,
          type: formData.type || TransactionType.Expense,
          category: formData.category || TransactionCategory.OtherExpense,
          description: formData.description || '',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'user', // TODO: Get from auth
          updatedBy: 'user', // TODO: Get from auth
          ...formData,
        };
        await dispatch(updateTransaction(updatedTransaction));
      } else {
        const newTransaction: Omit<Transaction, 'id'> = {
          date: formData.date || new Date(),
          amount: formData.amount || 0,
          type: formData.type || TransactionType.Expense,
          category: formData.category || TransactionCategory.OtherExpense,
          description: formData.description || '',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'user', // TODO: Get from auth
          updatedBy: 'user', // TODO: Get from auth
          ...formData,
        };
        await dispatch(createTransaction(newTransaction));
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error saving transaction:', error);
      Alert.alert(
        t('common.error'),
        t('financial.transactions.saveError')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTypeChange = (type: TransactionType) => {
    setFormData({ ...formData, type });
  };

  const handleCategoryChange = (category: TransactionCategory) => {
    setFormData({ ...formData, category });
  };

  const handleDateChange = (date: Date) => {
    setFormData({ ...formData, date });
  };

  const handleTagChange = (tags: string[]) => {
    setFormData({ ...formData, tags });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B7302" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('financial.transactions.type')}
        </Text>
        <View style={styles.typeButtons}>
          {Object.values(TransactionType).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                formData.type === type && styles.typeButtonSelected,
              ]}
              onPress={() => handleTypeChange(type)}
            >
              <Icon
                name={
                  type === TransactionType.Income
                    ? 'arrow-down-bold-circle'
                    : type === TransactionType.Expense
                    ? 'arrow-up-bold-circle'
                    : 'swap-horizontal-circle'
                }
                size={24}
                color={formData.type === type ? '#FFF' : '#666'}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  formData.type === type && styles.typeButtonTextSelected,
                ]}
              >
                {t(`financial.types.${type}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('financial.transactions.amount')}
        </Text>
        <TextInput
          style={styles.amountInput}
          value={formData.amount?.toString()}
          onChangeText={(text) =>
            setFormData({
              ...formData,
              amount: parseFloat(text) || 0,
            })
          }
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('financial.transactions.description')}
        </Text>
        <TextInput
          style={styles.input}
          value={formData.description}
          onChangeText={(text) =>
            setFormData({ ...formData, description: text })
          }
          placeholder={t('financial.transactions.descriptionPlaceholder')}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('financial.transactions.category')}
        </Text>
        <MultiSelect
          items={Object.values(TransactionCategory)}
          selectedItems={formData.category ? [formData.category] : []}
          onChange={(categories) =>
            handleCategoryChange(categories[0] as TransactionCategory)
          }
          renderItem={(category) => (
            <Text>{t(`financial.categories.${category}`)}</Text>
          )}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('financial.transactions.date')}
        </Text>
        <DateRangePicker
          startDate={formData.date}
          endDate={formData.date}
          onChange={(startDate) => handleDateChange(startDate || new Date())}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('common.tags')}
        </Text>
        <MultiSelect
          items={[]} // TODO: Get available tags from store
          selectedItems={formData.tags || []}
          onChange={handleTagChange}
          renderItem={(tag) => <Text>{tag}</Text>}
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>
            {t('common.cancel')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Icon name="check" size={20} color="#FFF" />
              <Text style={styles.saveButtonText}>
                {t('common.save')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  section: {
    backgroundColor: '#FFF',
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  typeButtonSelected: {
    backgroundColor: '#3B7302',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  typeButtonTextSelected: {
    color: '#FFF',
  },
  amountInput: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  input: {
    fontSize: 16,
    color: '#333',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    marginTop: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  saveButton: {
    backgroundColor: '#3B7302',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    marginLeft: 8,
  },
}); 