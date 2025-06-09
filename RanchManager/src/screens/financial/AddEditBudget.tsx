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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootState, AppDispatch } from '../../store/store';
import { Budget, TransactionCategory } from '../../store/types/financial';
import { createBudget, updateBudget } from '../../store/actions/financialActions';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FinancialStackParamList } from '../../navigation/FinancialNavigator';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

interface AddEditBudgetProps {
  route: {
    params?: {
      budgetId?: string;
    };
  };
  navigation: NativeStackNavigationProp<FinancialStackParamList, 'AddEditBudget'>;
}

interface CategoryAllocation {
  allocated: number;
  spent: number;
}

export const AddEditBudget: React.FC<AddEditBudgetProps> = ({ route, navigation }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [categories, setCategories] = useState<Record<TransactionCategory, CategoryAllocation>>({} as Record<TransactionCategory, CategoryAllocation>);
  const [notes, setNotes] = useState('');

  const existingBudget = useSelector((state: RootState) =>
    route.params?.budgetId
      ? state.financial.budgets.items.find((b) => b.id === route.params.budgetId)
      : null
  );

  useEffect(() => {
    if (existingBudget) {
      setName(existingBudget.name);
      setPeriod(existingBudget.period);
      setStartDate(new Date(existingBudget.startDate));
      setEndDate(new Date(existingBudget.endDate));
      setCategories(existingBudget.categories as Record<TransactionCategory, CategoryAllocation>);
      setNotes(existingBudget.notes || '');
    }
  }, [existingBudget]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('budget.validation.nameRequired'));
      return;
    }

    if (startDate >= endDate) {
      Alert.alert(t('common.error'), t('budget.validation.invalidDateRange'));
      return;
    }

    const totalAllocated = Object.values(categories).reduce(
      (sum, cat) => sum + (cat?.allocated || 0),
      0
    );

    if (totalAllocated <= 0) {
      Alert.alert(t('common.error'), t('budget.validation.allocateAmount'));
      return;
    }

    try {
      setIsSubmitting(true);
      const budgetData = {
        name: name.trim(),
        period,
        startDate,
        endDate,
        categories,
        notes: notes.trim() || undefined,
        createdAt: existingBudget?.createdAt || new Date(),
        updatedAt: new Date(),
        createdBy: existingBudget?.createdBy || 'user', // TODO: Get actual user ID
        updatedBy: 'user', // TODO: Get actual user ID
      };

      if (existingBudget) {
        await dispatch(updateBudget({ ...budgetData, id: existingBudget.id })).unwrap();
      } else {
        await dispatch(createBudget(budgetData)).unwrap();
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert(
        t('common.error'),
        existingBudget
          ? t('budget.update.error')
          : t('budget.create.error')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return format(date, 'PPP', {
      locale: i18n.language === 'es' ? es : enUS,
    });
  };

  const handleCategoryChange = (category: TransactionCategory, field: 'allocated' | 'spent', value: string) => {
    const numValue = parseFloat(value) || 0;
    setCategories((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: numValue,
      },
    }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>{t('budget.name')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t('budget.namePlaceholder')}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('budget.period')}</Text>
          <View style={styles.periodButtons}>
            {(['monthly', 'quarterly', 'annual'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.periodButton,
                  period === p && styles.periodButtonActive,
                ]}
                onPress={() => setPeriod(p)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    period === p && styles.periodButtonTextActive,
                  ]}
                >
                  {t(`budget.period.${p}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('budget.startDate')}</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>{formatDate(startDate)}</Text>
            <Icon name="calendar" size={20} color="#666" />
          </TouchableOpacity>
          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowStartDatePicker(false);
                if (selectedDate) {
                  setStartDate(selectedDate);
                }
              }}
            />
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('budget.endDate')}</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
            <Icon name="calendar" size={20} color="#666" />
          </TouchableOpacity>
          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowEndDatePicker(false);
                if (selectedDate) {
                  setEndDate(selectedDate);
                }
              }}
            />
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('budget.categories')}</Text>
          {Object.values(TransactionCategory).map((category) => (
            <View key={category} style={styles.categoryField}>
              <Text style={styles.categoryLabel}>
                {t(`transaction.category.${category}`)}
              </Text>
              <View style={styles.categoryInputs}>
                <View style={styles.categoryInput}>
                  <Text style={styles.categoryInputLabel}>
                    {t('budget.allocated')}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={categories[category]?.allocated.toString() || '0'}
                    onChangeText={(value) =>
                      handleCategoryChange(category, 'allocated', value)
                    }
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                <View style={styles.categoryInput}>
                  <Text style={styles.categoryInputLabel}>
                    {t('budget.spent')}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={categories[category]?.spent.toString() || '0'}
                    onChangeText={(value) =>
                      handleCategoryChange(category, 'spent', value)
                    }
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('budget.notes')}</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('budget.notesPlaceholder')}
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {existingBudget ? t('common.save') : t('common.create')}
            </Text>
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
  form: {
    padding: 16,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#3B7302',
    borderColor: '#3B7302',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#FFF',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  categoryField: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  categoryInputs: {
    flexDirection: 'row',
    gap: 16,
  },
  categoryInput: {
    flex: 1,
  },
  categoryInputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#3B7302',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 