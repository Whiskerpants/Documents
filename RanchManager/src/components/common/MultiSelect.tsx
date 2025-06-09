import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  FlatList,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface MultiSelectProps<T> {
  items: T[];
  selectedItems: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T) => React.ReactNode;
  placeholder?: string;
}

export function MultiSelect<T>({
  items,
  selectedItems,
  onChange,
  renderItem,
  placeholder,
}: MultiSelectProps<T>) {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);

  const handleItemPress = (item: T) => {
    const isSelected = selectedItems.includes(item);
    if (isSelected) {
      onChange(selectedItems.filter((i) => i !== item));
    } else {
      onChange([...selectedItems, item]);
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  const renderSelectedItems = () => {
    if (selectedItems.length === 0) {
      return (
        <Text style={styles.placeholder}>
          {placeholder || t('common.selectItems')}
        </Text>
      );
    }

    return (
      <View style={styles.selectedContainer}>
        {selectedItems.map((item, index) => (
          <View key={index} style={styles.selectedItem}>
            <Text style={styles.selectedItemText} numberOfLines={1}>
              {renderItem(item)}
            </Text>
            <TouchableOpacity
              onPress={() => handleItemPress(item)}
              style={styles.removeButton}
            >
              <Icon name="close" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setShowModal(true)}
      >
        {renderSelectedItems()}
        <Icon name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {placeholder || t('common.selectItems')}
              </Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={items}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.item,
                    selectedItems.includes(item) && styles.itemSelected,
                  ]}
                  onPress={() => handleItemPress(item)}
                >
                  <View style={styles.itemContent}>
                    {renderItem(item)}
                  </View>
                  {selectedItems.includes(item) && (
                    <Icon name="check" size={20} color="#3B7302" />
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.listContent}
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClear}
              >
                <Text style={styles.clearButtonText}>
                  {t('common.clear')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.doneButtonText}>
                  {t('common.done')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 40,
  },
  placeholder: {
    fontSize: 14,
    color: '#666',
  },
  selectedContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  selectedItemText: {
    fontSize: 12,
    color: '#3B7302',
    marginRight: 4,
  },
  removeButton: {
    padding: 2,
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
  listContent: {
    padding: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  itemSelected: {
    backgroundColor: '#F5F5F5',
  },
  itemContent: {
    flex: 1,
    marginRight: 8,
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
  doneButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#3B7302',
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  },
}); 