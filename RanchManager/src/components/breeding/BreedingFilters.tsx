import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { BreedingFilters as BreedingFiltersType, BreedingStatus, BreedingMethod } from '../../store/types/breeding';
import { format } from 'date-fns';

interface BreedingFiltersProps {
  filters: BreedingFiltersType;
  onFiltersChange: (filters: BreedingFiltersType) => void;
}

export const BreedingFilters: React.FC<BreedingFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleStatus = (status: BreedingStatus) => {
    const newStatus = filters.status === status ? undefined : status;
    onFiltersChange({ ...filters, status: newStatus });
  };

  const toggleMethod = (method: BreedingMethod) => {
    const newMethod = filters.method === method ? undefined : method;
    onFiltersChange({ ...filters, method: newMethod });
  };

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    const date = value ? new Date(value) : undefined;
    onFiltersChange({ ...filters, [field]: date });
  };

  const clearFilters = () => {
    onFiltersChange({});
    setSearchQuery('');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status) count++;
    if (filters.method) count++;
    if (filters.damId) count++;
    if (filters.sireId) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    return count;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.filterButtonText}>
          {t('breeding.filters.title')}
          {getActiveFiltersCount() > 0 && (
            <Text style={styles.filterCount}> ({getActiveFiltersCount()})</Text>
          )}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('breeding.filters.title')}</Text>

            <TextInput
              style={styles.searchInput}
              placeholder={t('breeding.filters.searchPlaceholder')}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <ScrollView style={styles.filtersList}>
              <Text style={styles.sectionTitle}>{t('breeding.filters.status')}</Text>
              <View style={styles.optionsContainer}>
                {Object.values(BreedingStatus).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.optionButton,
                      filters.status === status && styles.optionButtonActive,
                    ]}
                    onPress={() => toggleStatus(status)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        filters.status === status && styles.optionTextActive,
                      ]}
                    >
                      {t(`breeding.status.${status.toLowerCase()}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>{t('breeding.filters.method')}</Text>
              <View style={styles.optionsContainer}>
                {Object.values(BreedingMethod).map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.optionButton,
                      filters.method === method && styles.optionButtonActive,
                    ]}
                    onPress={() => toggleMethod(method)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        filters.method === method && styles.optionTextActive,
                      ]}
                    >
                      {t(`breeding.method.${method.toLowerCase()}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>{t('breeding.filters.dateRange')}</Text>
              <View style={styles.dateInputsContainer}>
                <View style={styles.dateInputWrapper}>
                  <Text style={styles.dateLabel}>{t('breeding.filters.startDate')}</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="YYYY-MM-DD"
                    value={filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : ''}
                    onChangeText={(value) => handleDateRangeChange('startDate', value)}
                  />
                </View>
                <View style={styles.dateInputWrapper}>
                  <Text style={styles.dateLabel}>{t('breeding.filters.endDate')}</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="YYYY-MM-DD"
                    value={filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : ''}
                    onChangeText={(value) => handleDateRangeChange('endDate', value)}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.clearButton]}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>{t('common.clear')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.applyButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.applyButtonText}>{t('common.apply')}</Text>
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
    marginVertical: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  filterButtonText: {
    fontSize: 16,
    color: '#333',
  },
  filterCount: {
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  filtersList: {
    maxHeight: '70%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    marginBottom: 8,
  },
  optionButtonActive: {
    backgroundColor: '#2196F3',
  },
  optionText: {
    color: '#333',
  },
  optionTextActive: {
    color: '#FFF',
  },
  dateInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  dateInputWrapper: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 16,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#F5F5F5',
  },
  applyButton: {
    backgroundColor: '#2196F3',
  },
  clearButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  applyButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
}); 