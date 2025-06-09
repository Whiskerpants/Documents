import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { HealthFilters as HealthFiltersType, HealthEventType, HealthSeverity } from '../../store/types/health';
import { HealthTypeIcon } from './HealthTypeIcon';
import { HealthStatusBadge } from './HealthStatusBadge';

interface HealthFiltersProps {
  filters: HealthFiltersType;
  onFiltersChange: (filters: HealthFiltersType) => void;
}

export const HealthFilters: React.FC<HealthFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const { t } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const handleTypeToggle = (type: HealthEventType) => {
    const currentTypes = filters.types || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    onFiltersChange({ ...filters, types: newTypes });
  };

  const handleSeverityToggle = (severity: HealthSeverity) => {
    const currentSeverities = filters.severities || [];
    const newSeverities = currentSeverities.includes(severity)
      ? currentSeverities.filter(s => s !== severity)
      : [...currentSeverities, severity];
    onFiltersChange({ ...filters, severities: newSeverities });
  };

  const handleResolvedToggle = () => {
    onFiltersChange({
      ...filters,
      resolved: filters.resolved === undefined ? false : undefined,
    });
  };

  const handleDateChange = (date: Date | undefined, isStart: boolean) => {
    if (isStart) {
      onFiltersChange({ ...filters, startDate: date });
    } else {
      onFiltersChange({ ...filters, endDate: date });
    }
  };

  const handleSearchChange = (text: string) => {
    onFiltersChange({ ...filters, searchQuery: text });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.types?.length) count++;
    if (filters.severities?.length) count++;
    if (filters.resolved !== undefined) count++;
    if (filters.startDate || filters.endDate) count++;
    if (filters.searchQuery) count++;
    return count;
  };

  return (
    <>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setIsModalVisible(true)}
      >
        <Icon name="filter-variant" size={20} color="#3B7302" />
        <Text style={styles.filterButtonText}>
          {t('health.filters.title')}
          {getActiveFiltersCount() > 0 && ` (${getActiveFiltersCount()})`}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('health.filters.title')}</Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterContent}>
              {/* Search */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>{t('health.filters.search')}</Text>
                <TextInput
                  style={styles.searchInput}
                  value={filters.searchQuery}
                  onChangeText={handleSearchChange}
                  placeholder={t('health.filters.searchPlaceholder')}
                />
              </View>

              {/* Date Range */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>{t('health.filters.dateRange')}</Text>
                <View style={styles.dateInputs}>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Text>
                      {filters.startDate
                        ? filters.startDate.toLocaleDateString()
                        : t('health.filters.startDate')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Text>
                      {filters.endDate
                        ? filters.endDate.toLocaleDateString()
                        : t('health.filters.endDate')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Event Types */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>{t('health.filters.types')}</Text>
                <View style={styles.typeGrid}>
                  {Object.values(HealthEventType).map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        filters.types?.includes(type) && styles.typeButtonActive,
                      ]}
                      onPress={() => handleTypeToggle(type)}
                    >
                      <HealthTypeIcon type={type} size={20} />
                      <Text style={styles.typeButtonText}>
                        {t(`health.types.${type}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Severities */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>{t('health.filters.severities')}</Text>
                <View style={styles.severityGrid}>
                  {Object.values(HealthSeverity).map(severity => (
                    <TouchableOpacity
                      key={severity}
                      style={[
                        styles.severityButton,
                        filters.severities?.includes(severity) && styles.severityButtonActive,
                      ]}
                      onPress={() => handleSeverityToggle(severity)}
                    >
                      <HealthStatusBadge severity={severity} size="small" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Resolved Status */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>{t('health.filters.status')}</Text>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    filters.resolved !== undefined && styles.statusButtonActive,
                  ]}
                  onPress={handleResolvedToggle}
                >
                  <Text style={styles.statusButtonText}>
                    {filters.resolved === undefined
                      ? t('health.filters.all')
                      : filters.resolved
                      ? t('health.filters.resolved')
                      : t('health.filters.unresolved')}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>
                  {t('health.filters.clear')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.applyButtonText}>
                  {t('health.filters.apply')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {(showStartDatePicker || showEndDatePicker) && (
        <DateTimePicker
          value={
            (showStartDatePicker ? filters.startDate : filters.endDate) || new Date()
          }
          mode="date"
          display="default"
          onChange={(event, date) => {
            if (event.type === 'set') {
              handleDateChange(date, showStartDatePicker);
            }
            setShowStartDatePicker(false);
            setShowEndDatePicker(false);
          }}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginRight: 8,
  },
  filterButtonText: {
    marginLeft: 4,
    color: '#3B7302',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
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
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  filterContent: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 8,
  },
  dateInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    margin: 4,
  },
  typeButtonActive: {
    backgroundColor: '#3B7302',
    borderColor: '#3B7302',
  },
  typeButtonText: {
    marginLeft: 4,
  },
  severityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  severityButton: {
    margin: 4,
  },
  severityButtonActive: {
    opacity: 0.7,
  },
  statusButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#3B7302',
    borderColor: '#3B7302',
  },
  statusButtonText: {
    color: '#000',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  clearButton: {
    flex: 1,
    padding: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#6B7280',
  },
  applyButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#3B7302',
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
}); 