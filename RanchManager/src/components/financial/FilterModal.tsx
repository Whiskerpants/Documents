import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TransactionType, TransactionCategory, TransactionFilters } from '../../store/types/financial';
import { DateRangePicker } from '../common/DateRangePicker';
import { MultiSelect } from '../common/MultiSelect';

interface FilterModalProps {
  visible: boolean;
  filters: TransactionFilters;
  onApply: (filters: TransactionFilters) => void;
  onClose: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({ visible, filters, onApply, onClose }) => {
  const { t } = useTranslation();
  const [localFilters, setLocalFilters] = useState<TransactionFilters>(filters);

  const handleDateChange = (startDate?: Date, endDate?: Date) => {
    setLocalFilters((prev) => ({ ...prev, startDate, endDate }));
  };

  const handleTypeChange = (types: TransactionType[]) => {
    setLocalFilters((prev) => ({ ...prev, type: types[0] }));
  };

  const handleCategoryChange = (categories: TransactionCategory[]) => {
    setLocalFilters((prev) => ({ ...prev, categories }));
  };

  const handleClear = () => {
    setLocalFilters({});
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('common.filters')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>{t('common.dateRange')}</Text>
            <DateRangePicker
              startDate={localFilters.startDate}
              endDate={localFilters.endDate}
              onChange={handleDateChange}
            />
            <Text style={styles.sectionTitle}>{t('financial.transactionType')}</Text>
            <MultiSelect
              items={Object.values(TransactionType)}
              selectedItems={localFilters.type ? [localFilters.type] : []}
              onChange={handleTypeChange}
              renderItem={(type) => <Text>{t(`financial.types.${type}`)}</Text>}
            />
            <Text style={styles.sectionTitle}>{t('financial.categories')}</Text>
            <MultiSelect
              items={Object.values(TransactionCategory)}
              selectedItems={localFilters.categories || []}
              onChange={handleCategoryChange}
              renderItem={(cat) => <Text>{t(`financial.categories.${cat}`)}</Text>}
            />
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>{t('common.clearFilters')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => {
                onApply(localFilters);
                onClose();
              }}
            >
              <Text style={styles.applyButtonText}>{t('common.apply')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
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