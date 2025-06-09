import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';
import { TransactionFilters, TransactionType, TransactionCategory } from '../../store/types/financial';
import { DateRangePicker } from '../common/DateRangePicker';
import { MultiSelect } from '../common/MultiSelect';

interface FinancialFiltersProps {
  filters: TransactionFilters;
  onFilterChange: (filters: Partial<TransactionFilters>) => void;
}

export const FinancialFilters: React.FC<FinancialFiltersProps> = ({
  filters,
  onFilterChange,
}) => {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);

  const transactionTypes = Object.values(TransactionType);
  const categories = Object.values(TransactionCategory);

  const handleDateRangeChange = (startDate: Date | undefined, endDate: Date | undefined) => {
    onFilterChange({ startDate, endDate });
  };

  const handleTypeChange = (types: TransactionType[]) => {
    onFilterChange({ types });
  };

  const handleCategoryChange = (categories: TransactionCategory[]) => {
    onFilterChange({ categories });
  };

  const handleTagChange = (tags: string[]) => {
    onFilterChange({ tags });
  };

  const handleClearFilters = () => {
    onFilterChange({
      startDate: undefined,
      endDate: undefined,
      types: undefined,
      categories: undefined,
      tags: undefined,
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.startDate || filters.endDate) count++;
    if (filters.types?.length) count++;
    if (filters.categories?.length) count++;
    if (filters.tags?.length) count++;
    return count;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowFilters(true)}
      >
        <Icon name="filter-variant" size={20} color="#3B7302" />
        <Text style={styles.filterButtonText}>
          {t('common.filters')}
        </Text>
        {getActiveFiltersCount() > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {getActiveFiltersCount()}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t('common.filters')}
              </Text>
              <TouchableOpacity
                onPress={() => setShowFilters(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterContent}>
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>
                  {t('common.dateRange')}
                </Text>
                <DateRangePicker
                  startDate={filters.startDate}
                  endDate={filters.endDate}
                  onChange={handleDateRangeChange}
                />
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>
                  {t('financial.transactionType')}
                </Text>
                <MultiSelect
                  items={transactionTypes}
                  selectedItems={filters.types || []}
                  onChange={handleTypeChange}
                  renderItem={(type) => (
                    <Text>{t(`financial.types.${type}`)}</Text>
                  )}
                />
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>
                  {t('financial.categories')}
                </Text>
                <MultiSelect
                  items={categories}
                  selectedItems={filters.categories || []}
                  onChange={handleCategoryChange}
                  renderItem={(category) => (
                    <Text>{t(`financial.categories.${category}`)}</Text>
                  )}
                />
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>
                  {t('common.tags')}
                </Text>
                <MultiSelect
                  items={[]} // TODO: Get available tags from store
                  selectedItems={filters.tags || []}
                  onChange={handleTagChange}
                  renderItem={(tag) => <Text>{tag}</Text>}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearFilters}
              >
                <Text style={styles.clearButtonText}>
                  {t('common.clearFilters')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>
                  {t('common.apply')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#3B7302',
    marginLeft: 8,
  },
  badge: {
    backgroundColor: '#3B7302',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  filterContent: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B7302',
  },
  clearButtonText: {
    color: '#3B7302',
    fontSize: 16,
    textAlign: 'center',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#3B7302',
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  },
}); 