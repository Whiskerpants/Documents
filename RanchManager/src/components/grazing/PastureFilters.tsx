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
import { GrazingFilters, PastureStatus } from '../../store/types/grazing';
import { PastureStatusBadge } from './PastureStatusBadge';

interface PastureFiltersProps {
  filters: GrazingFilters;
  onFiltersChange: (filters: GrazingFilters) => void;
}

export const PastureFilters: React.FC<PastureFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters.search || '');

  const handleStatusToggle = (status: PastureStatus) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];

    onFiltersChange({
      ...filters,
      status: newStatuses,
    });
  };

  const handleSizeChange = (type: 'min' | 'max', value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    onFiltersChange({
      ...filters,
      [type === 'min' ? 'minSize' : 'maxSize']: numValue,
    });
  };

  const handleForageTypeToggle = (type: string) => {
    const currentTypes = filters.forageTypes || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];

    onFiltersChange({
      ...filters,
      forageTypes: newTypes,
    });
  };

  const handleAvailableToggle = () => {
    onFiltersChange({
      ...filters,
      available: !filters.available,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
    setSearchQuery('');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status?.length) count++;
    if (filters.minSize !== undefined) count++;
    if (filters.maxSize !== undefined) count++;
    if (filters.forageTypes?.length) count++;
    if (filters.available) count++;
    if (filters.search) count++;
    return count;
  };

  return (
    <>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setModalVisible(true)}
      >
        <Icon name="filter-variant" size={20} color="#374151" />
        <Text style={styles.filterButtonText}>
          {t('grazing.filters.title')}
          {getActiveFiltersCount() > 0 && (
            <Text style={styles.filterCount}>
              {' '}
              ({getActiveFiltersCount()})
            </Text>
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('grazing.filters.title')}</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Search */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('grazing.filters.search')}</Text>
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={text => {
                    setSearchQuery(text);
                    onFiltersChange({
                      ...filters,
                      search: text,
                    });
                  }}
                  placeholder={t('grazing.filters.searchPlaceholder')}
                />
              </View>

              {/* Status */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('grazing.filters.status')}</Text>
                <View style={styles.statusContainer}>
                  {Object.values(PastureStatus).map(status => (
                    <TouchableOpacity
                      key={status}
                      onPress={() => handleStatusToggle(status)}
                      style={[
                        styles.statusButton,
                        filters.status?.includes(status) && styles.statusButtonActive,
                      ]}
                    >
                      <PastureStatusBadge status={status} size="small" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Size Range */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('grazing.filters.size')}</Text>
                <View style={styles.sizeContainer}>
                  <TextInput
                    style={styles.sizeInput}
                    value={filters.minSize?.toString() || ''}
                    onChangeText={value => handleSizeChange('min', value)}
                    placeholder={t('grazing.filters.minSize')}
                    keyboardType="numeric"
                  />
                  <Text style={styles.sizeSeparator}>-</Text>
                  <TextInput
                    style={styles.sizeInput}
                    value={filters.maxSize?.toString() || ''}
                    onChangeText={value => handleSizeChange('max', value)}
                    placeholder={t('grazing.filters.maxSize')}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Forage Types */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('grazing.filters.forageTypes')}</Text>
                <View style={styles.forageTypesContainer}>
                  {['Grass', 'Legume', 'Forb', 'Shrub'].map(type => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => handleForageTypeToggle(type)}
                      style={[
                        styles.forageTypeButton,
                        filters.forageTypes?.includes(type) && styles.forageTypeButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.forageTypeText,
                          filters.forageTypes?.includes(type) && styles.forageTypeTextActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Available Only */}
              <View style={styles.section}>
                <TouchableOpacity
                  style={styles.availableToggle}
                  onPress={handleAvailableToggle}
                >
                  <Icon
                    name={filters.available ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={24}
                    color={filters.available ? '#10B981' : '#6B7280'}
                  />
                  <Text style={styles.availableText}>
                    {t('grazing.filters.availableOnly')}
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
                  {t('grazing.filters.clear')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.applyButtonText}>
                  {t('grazing.filters.apply')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 16,
  },
  filterButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  filterCount: {
    color: '#6B7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
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
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  statusButtonActive: {
    opacity: 0.7,
  },
  sizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sizeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  sizeSeparator: {
    marginHorizontal: 8,
    color: '#6B7280',
  },
  forageTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  forageTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    marginBottom: 8,
  },
  forageTypeButtonActive: {
    backgroundColor: '#10B981',
  },
  forageTypeText: {
    color: '#374151',
    fontSize: 14,
  },
  forageTypeTextActive: {
    color: '#FFFFFF',
  },
  availableToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availableText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#374151',
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  clearButtonText: {
    textAlign: 'center',
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#10B981',
    borderRadius: 8,
  },
  applyButtonText: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
}); 