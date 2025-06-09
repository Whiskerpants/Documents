import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { ReportType, ReportParameters as ReportParams } from '../../../store/types/financial';
import { MultiSelect } from '../../../components/common/MultiSelect';
import { DateRangePicker } from '../../../components/common/DateRangePicker';
import { TransactionCategory } from '../../../store/types/financial';

interface ReportParametersProps {
  type: ReportType;
  parameters: ReportParams;
  onParametersChange: (parameters: ReportParams) => void;
}

export const ReportParameters: React.FC<ReportParametersProps> = ({
  type,
  parameters,
  onParametersChange
}) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatDate = (date: Date) => {
    return format(date, 'PPP', {
      locale: i18n.language === 'es' ? es : enUS,
    });
  };

  const handleDateChange = (startDate: Date | undefined, endDate: Date | undefined) => {
    onParametersChange({
      ...parameters,
      startDate: startDate?.toISOString() || '',
      endDate: endDate?.toISOString() || ''
    });
  };

  const handleCategoriesChange = (selectedCategories: TransactionCategory[]) => {
    onParametersChange({
      ...parameters,
      categories: selectedCategories.map(cat => cat.toString())
    });
  };

  const handleEntitiesChange = (selectedEntities: string[]) => {
    onParametersChange({
      ...parameters,
      entities: selectedEntities
    });
  };

  const categoryOptions = Object.values(TransactionCategory);
  const entityOptions = [
    'cattle_a',
    'cattle_b',
    'pasture_1',
    'pasture_2'
  ];

  const renderCategory = (category: TransactionCategory) => (
    t(`categories.${category}`)
  );

  const renderEntity = (entity: string) => {
    const entityLabels: Record<string, string> = {
      cattle_a: 'Cattle A',
      cattle_b: 'Cattle B',
      pasture_1: 'Pasture 1',
      pasture_2: 'Pasture 2'
    };
    return entityLabels[entity] || entity;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {t('financial.reports.parameters.title')}
      </Text>

      <DateRangePicker
        startDate={parameters.startDate ? new Date(parameters.startDate) : undefined}
        endDate={parameters.endDate ? new Date(parameters.endDate) : undefined}
        onChange={handleDateChange}
      />

      {(type === 'expense' || type === 'budget') && (
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t('financial.reports.parameters.categories')}
          </Text>
          <MultiSelect<TransactionCategory>
            items={categoryOptions}
            selectedItems={parameters.categories.map(cat => cat as TransactionCategory)}
            onChange={handleCategoriesChange}
            renderItem={renderCategory}
            placeholder={t('reports.parameters.selectCategories')}
          />
        </View>
      )}

      {type === 'entity' && (
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t('financial.reports.parameters.entities')}
          </Text>
          <MultiSelect<string>
            items={entityOptions}
            selectedItems={parameters.entities}
            onChange={handleEntitiesChange}
            renderItem={renderEntity}
            placeholder={t('reports.parameters.selectEntities')}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  section: {
    marginTop: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
}); 