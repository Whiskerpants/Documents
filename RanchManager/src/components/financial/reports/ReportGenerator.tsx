import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RootState } from '../../../store/store';
import {
  ReportType,
  ReportParameters,
  Report,
  TransactionCategory,
} from '../../../store/types/financial';
import { generateReport, exportReport } from '../../../store/actions/financialActions';
import { IncomeStatement } from './IncomeStatement';
import { ExpenseBreakdown } from './ExpenseBreakdown';
import { BudgetPerformance } from './BudgetPerformance';
import { EntityProfitability } from './EntityProfitability';
import { ErrorMessage } from '../../common/ErrorMessage';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { MultiSelect } from '../../common/MultiSelect';
import { DateRangePicker } from '../../common/DateRangePicker';
import { Chart } from '../../common/Chart';

const PRIMARY = '#3B7302';
const screenWidth = Dimensions.get('window').width;

interface ReportGeneratorProps {
  onSaveConfig?: (config: ReportParameters) => void;
  onSchedule?: (config: ReportParameters) => void;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  onSaveConfig,
  onSchedule,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch();

  // State
  const [selectedType, setSelectedType] = useState<ReportType>('income');
  const [parameters, setParameters] = useState<ReportParameters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
    categories: [],
    entities: [],
  });
  const [grouping, setGrouping] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('month');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);

  // Redux state
  const { items: reports, loading } = useSelector((state: RootState) => state.financial.reports);
  const { items: categories } = useSelector((state: RootState) => state.financial.transactions);
  const { items: entities } = useSelector((state: RootState) => state.financial.budgets);

  // Report types
  const reportTypes = [
    { type: 'income', icon: 'cash-plus', label: t('financial.reports.types.income') },
    { type: 'expense', icon: 'cash-minus', label: t('financial.reports.types.expense') },
    { type: 'budget', icon: 'chart-line', label: t('financial.reports.types.budget') },
    { type: 'entity', icon: 'account-group', label: t('financial.reports.types.entity') },
  ];

  // Grouping options
  const groupingOptions = [
    { value: 'day', label: t('financial.reports.grouping.day') },
    { value: 'week', label: t('financial.reports.grouping.week') },
    { value: 'month', label: t('financial.reports.grouping.month') },
    { value: 'quarter', label: t('financial.reports.grouping.quarter') },
    { value: 'year', label: t('financial.reports.grouping.year') },
  ];

  // Handlers
  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      await dispatch<any>(generateReport({ type: selectedType, parameters }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'csv') => {
    try {
      setIsGenerating(true);
      setError(null);
      await dispatch<any>(exportReport({ reportId: reports[selectedType]?.id, format }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(null);
    if (selectedDate) {
      setParameters(prev => ({
        ...prev,
        [showDatePicker === 'start' ? 'startDate' : 'endDate']: selectedDate.toISOString(),
      }));
    }
  };

  // Renderers
  const renderReportTypeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('financial.reports.selectType')}</Text>
      <View style={styles.reportTypes}>
        {reportTypes.map(({ type, icon, label }) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.reportTypeButton,
              selectedType === type && styles.selectedReport,
              { borderColor: colors.border },
            ]}
            onPress={() => setSelectedType(type as ReportType)}
          >
            <Icon name={icon} size={24} color={selectedType === type ? PRIMARY : colors.text} />
            <Text style={[styles.reportTypeText, { color: colors.text }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderParameters = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('financial.reports.parameters')}</Text>
      
      {/* Date Range */}
      <View style={styles.parameterGroup}>
        <Text style={styles.parameterLabel}>{t('financial.reports.dateRange')}</Text>
        <DateRangePicker
          startDate={new Date(parameters.startDate)}
          endDate={new Date(parameters.endDate)}
          onChange={(start, end) => {
            setParameters(prev => ({
              ...prev,
              startDate: start?.toISOString() || prev.startDate,
              endDate: end?.toISOString() || prev.endDate,
            }));
          }}
        />
      </View>

      {/* Categories */}
      <View style={styles.parameterGroup}>
        <Text style={styles.parameterLabel}>{t('financial.reports.categories')}</Text>
        <MultiSelect<{ value: string; label: string }>
          items={categories.map(cat => ({ value: cat.id, label: cat.category }))}
          selectedItems={parameters.categories.map(id => {
            const cat = categories.find(c => c.id === id);
            return { value: id, label: cat?.category || '' };
          })}
          onChange={(selected) => setParameters(prev => ({
            ...prev,
            categories: selected.map(item => item.value)
          }))}
          renderItem={(item) => item.label}
          placeholder={t('financial.reports.selectCategories')}
        />
      </View>

      {/* Entities (only for entity reports) */}
      {selectedType === 'entity' && (
        <View style={styles.parameterGroup}>
          <Text style={styles.parameterLabel}>{t('financial.reports.entities')}</Text>
          <MultiSelect<{ value: string; label: string }>
            items={entities.map(ent => ({ value: ent.id, label: ent.name }))}
            selectedItems={parameters.entities.map(id => {
              const ent = entities.find(e => e.id === id);
              return { value: id, label: ent?.name || '' };
            })}
            onChange={(selected) => setParameters(prev => ({
              ...prev,
              entities: selected.map(item => item.value)
            }))}
            renderItem={(item) => item.label}
            placeholder={t('financial.reports.selectEntities')}
          />
        </View>
      )}

      {/* Grouping */}
      <View style={styles.parameterGroup}>
        <Text style={styles.parameterLabel}>{t('financial.reports.grouping')}</Text>
        <View style={styles.groupingOptions}>
          {groupingOptions.map(({ value, label }) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.groupingButton,
                grouping === value && styles.selectedGrouping,
                { borderColor: colors.border },
              ]}
              onPress={() => setGrouping(value as typeof grouping)}
            >
              <Text style={[styles.groupingText, { color: colors.text }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderActions = () => (
    <View style={styles.actions}>
      <TouchableOpacity
        style={[styles.generateButton, { backgroundColor: PRIMARY }]}
        onPress={handleGenerateReport}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.generateButtonText}>
            {t('financial.reports.generate')}
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.secondaryActions}>
        {onSaveConfig && (
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={() => onSaveConfig(parameters)}
          >
            <Icon name="content-save" size={20} color={colors.text} />
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              {t('financial.reports.saveConfig')}
            </Text>
          </TouchableOpacity>
        )}

        {onSchedule && (
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={() => onSchedule(parameters)}
          >
            <Icon name="calendar-clock" size={20} color={colors.text} />
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              {t('financial.reports.schedule')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderReportContent = () => {
    if (loading || isGenerating) {
      return <LoadingSpinner />;
    }

    if (error) {
      return <ErrorMessage message={error} />;
    }

    const report = reports.find(r => r.type === selectedType);
    if (!report) {
      return (
        <Text style={styles.emptyText}>
          {t('financial.reports.noReport')}
        </Text>
      );
    }

    switch (selectedType) {
      case 'income':
        return <IncomeStatement report={report} />;
      case 'expense':
        return <ExpenseBreakdown report={report} />;
      case 'budget':
        return <BudgetPerformance report={report} />;
      case 'entity':
        return <EntityProfitability report={report} />;
      default:
        return null;
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {renderReportTypeSelector()}
      {renderParameters()}
      {renderActions()}
      {renderReportContent()}

      {showDatePicker && (
        <DateTimePicker
          value={new Date(showDatePicker === 'start' ? parameters.startDate : parameters.endDate)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: PRIMARY,
  },
  reportTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  reportTypeButton: {
    flex: 1,
    minWidth: screenWidth / 2 - 32,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  selectedReport: {
    backgroundColor: '#E8F5E9',
    borderColor: PRIMARY,
  },
  reportTypeText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  parameterGroup: {
    marginBottom: 16,
  },
  parameterLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  groupingOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  groupingButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  selectedGrouping: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  groupingText: {
    fontSize: 14,
  },
  actions: {
    padding: 16,
    gap: 16,
  },
  generateButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.7,
    marginTop: 32,
  },
}); 