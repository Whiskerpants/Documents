import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootState, AppDispatch } from '../../store/store';
import { deleteTransaction } from '../../store/actions/financialActions';
import { Transaction, TransactionType } from '../../store/types/financial';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

interface TransactionDetailProps {
  route: {
    params: {
      transactionId: string;
    };
  };
  navigation: any; // TODO: Replace with proper navigation type
}

export const TransactionDetail: React.FC<TransactionDetailProps> = ({ route, navigation }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const transaction = useSelector((state: RootState) =>
    state.financial.transactions.items.find((t) => t.id === route.params.transactionId)
  );

  useEffect(() => {
    if (!transaction) {
      navigation.goBack();
    }
  }, [transaction, navigation]);

  const handleDelete = async () => {
    if (!transaction) return;
    
    try {
      setLoading(true);
      await dispatch(deleteTransaction(transaction.id)).unwrap();
      navigation.goBack();
    } catch (error) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!transaction) return;

    try {
      const message = `${t('financial.transaction')}: ${transaction.description}\n` +
        `${t('financial.amount')}: ${formatAmount(transaction.amount)}\n` +
        `${t('financial.date')}: ${formatDate(transaction.date)}\n` +
        `${t('financial.category')}: ${t(`financial.categories.${transaction.category}`)}\n` +
        `${t('financial.type')}: ${t(`financial.types.${transaction.type}`)}`;

      await Share.share({
        message,
        title: t('financial.shareTransaction'),
      });
    } catch (error) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  const handleEdit = () => {
    if (!transaction) return;
    navigation.navigate('AddEditTransaction', { transactionId: transaction.id });
  };

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'USD' }).format(amount);

  const formatDate = (date: Date) =>
    format(date, 'PPP', { locale: i18n.language === 'es' ? es : enUS });

  if (!transaction) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B7302" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={[
        styles.header,
        { backgroundColor: transaction.type === TransactionType.Income ? '#4CAF50' : '#F44336' }
      ]}>
        <Text style={styles.amount}>{formatAmount(transaction.amount)}</Text>
        <Text style={styles.type}>{t(`financial.types.${transaction.type}`)}</Text>
      </View>

      {/* Details Card */}
      <View style={styles.card}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('financial.details')}</Text>
          <View style={styles.detailRow}>
            <Icon name="calendar" size={20} color="#666" />
            <Text style={styles.detailText}>{formatDate(transaction.date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="tag" size={20} color="#666" />
            <Text style={styles.detailText}>{t(`financial.categories.${transaction.category}`)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="text" size={20} color="#666" />
            <Text style={styles.detailText}>{transaction.description}</Text>
          </View>
        </View>

        {/* Related Entity Section */}
        {transaction.relatedEntityId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('financial.relatedEntity')}</Text>
            <TouchableOpacity
              style={styles.entityButton}
              onPress={() => navigation.navigate('EntityDetail', { id: transaction.relatedEntityId })}
            >
              <Icon name="link" size={20} color="#3B7302" />
              <Text style={styles.entityButtonText}>{t('financial.viewEntity')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Attachments Section */}
        {transaction.attachments && transaction.attachments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('financial.attachments')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attachmentsContainer}>
              {transaction.attachments.map((attachment, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.attachmentButton}
                  onPress={() => navigation.navigate('AttachmentViewer', { url: attachment })}
                >
                  <Icon name="file-document" size={24} color="#3B7302" />
                  <Text style={styles.attachmentText}>{t('financial.viewAttachment')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Tags Section */}
        {transaction.tags && transaction.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('financial.tags')}</Text>
            <View style={styles.tagsContainer}>
              {transaction.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Metadata Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('financial.metadata')}</Text>
          <View style={styles.detailRow}>
            <Icon name="account" size={20} color="#666" />
            <Text style={styles.detailText}>{t('financial.createdBy')}: {transaction.createdBy}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="clock" size={20} color="#666" />
            <Text style={styles.detailText}>{t('financial.createdAt')}: {formatDate(transaction.createdAt)}</Text>
          </View>
          {transaction.updatedAt && (
            <View style={styles.detailRow}>
              <Icon name="update" size={20} color="#666" />
              <Text style={styles.detailText}>{t('financial.updatedAt')}: {formatDate(transaction.updatedAt)}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={handleEdit}
          disabled={loading}
        >
          <Icon name="pencil" size={24} color="#FFF" />
          <Text style={styles.actionButtonText}>{t('common.edit')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton]}
          onPress={handleShare}
          disabled={loading}
        >
          <Icon name="share-variant" size={24} color="#FFF" />
          <Text style={styles.actionButtonText}>{t('common.share')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => setShowDeleteConfirm(true)}
          disabled={loading}
        >
          <Icon name="delete" size={24} color="#FFF" />
          <Text style={styles.actionButtonText}>{t('common.delete')}</Text>
        </TouchableOpacity>
      </View>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('financial.deleteConfirmation')}</Text>
            <Text style={styles.modalText}>{t('financial.deleteConfirmationText')}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.modalButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleDelete}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalButtonText}>{t('common.confirm')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  header: {
    padding: 24,
    alignItems: 'center',
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  type: {
    fontSize: 18,
    color: '#FFF',
    opacity: 0.9,
  },
  card: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  entityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  entityButtonText: {
    fontSize: 16,
    color: '#3B7302',
    marginLeft: 8,
  },
  attachmentsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  attachmentText: {
    fontSize: 16,
    color: '#3B7302',
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#3B7302',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  editButton: {
    backgroundColor: '#3B7302',
  },
  shareButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  confirmButton: {
    backgroundColor: '#F44336',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
}); 