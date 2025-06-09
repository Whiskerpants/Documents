import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Text } from './Text';
import { Icon } from './Icon';
import { Button } from './Button';
import { SyncService, SyncItem, SyncConflict, SyncStats } from '../../services/SyncService';

interface SyncStatusProps {
  showDetails?: boolean;
  onSyncStart?: () => void;
  onSyncComplete?: (stats: SyncStats) => void;
  onSyncError?: (error: string) => void;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({
  showDetails = false,
  onSyncStart,
  onSyncComplete,
  onSyncError,
}) => {
  const theme = useTheme();
  const syncService = SyncService.getInstance();
  const [isSyncing, setIsSyncing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState<SyncStats>(syncService.getStats());
  const [queue, setQueue] = useState<SyncItem[]>(syncService.getQueue());
  const [conflicts, setConflicts] = useState<SyncConflict[]>(syncService.getConflicts());
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null);

  useEffect(() => {
    const handleSyncStart = () => {
      setIsSyncing(true);
      onSyncStart?.();
    };

    const handleSyncComplete = (newStats: SyncStats) => {
      setIsSyncing(false);
      setStats(newStats);
      onSyncComplete?.(newStats);
    };

    const handleSyncError = (error: string) => {
      setIsSyncing(false);
      onSyncError?.(error);
    };

    const handleQueueUpdate = (newQueue: SyncItem[]) => {
      setQueue(newQueue);
    };

    const handleConflictDetected = (conflict: SyncConflict) => {
      setConflicts(prev => [...prev, conflict]);
      setSelectedConflict(conflict);
    };

    syncService.onSyncStart(handleSyncStart);
    syncService.onSyncComplete(handleSyncComplete);
    syncService.onSyncError(handleSyncError);
    syncService.onQueueUpdated(handleQueueUpdate);
    syncService.onConflictDetected(handleConflictDetected);

    return () => {
      // Cleanup event listeners
      syncService.eventEmitter.removeListener('syncStart', handleSyncStart);
      syncService.eventEmitter.removeListener('syncComplete', handleSyncComplete);
      syncService.eventEmitter.removeListener('syncError', handleSyncError);
      syncService.eventEmitter.removeListener('queueUpdated', handleQueueUpdate);
      syncService.eventEmitter.removeListener('conflictDetected', handleConflictDetected);
    };
  }, [syncService, onSyncStart, onSyncComplete, onSyncError]);

  const handleSyncPress = async () => {
    if (isSyncing) {
      return;
    }

    try {
      await syncService.startSync();
    } catch (error) {
      Alert.alert('Sync Error', error.message);
    }
  };

  const handleConflictResolution = async (resolution: 'local' | 'remote') => {
    if (!selectedConflict) {
      return;
    }

    try {
      await syncService.resolveConflict(selectedConflict, resolution);
      setConflicts(prev => prev.filter(c => c.id !== selectedConflict.id));
      setSelectedConflict(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to resolve conflict');
    }
  };

  const renderSyncButton = () => (
    <TouchableOpacity
      style={[
        styles.syncButton,
        isSyncing && styles.syncingButton,
        { backgroundColor: theme.colors.primary },
      ]}
      onPress={handleSyncPress}
      disabled={isSyncing}
    >
      <Icon
        name={isSyncing ? 'sync' : 'sync'}
        size={20}
        color="#fff"
        style={isSyncing && styles.rotatingIcon}
      />
      <Text style={styles.syncButtonText}>
        {isSyncing ? 'Syncing...' : 'Sync'}
      </Text>
    </TouchableOpacity>
  );

  const renderSyncDetails = () => (
    <View style={styles.detailsContainer}>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Pending</Text>
          <Text style={styles.statValue}>{stats.pendingChanges}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Failed</Text>
          <Text style={styles.statValue}>{stats.failedChanges}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Last Sync</Text>
          <Text style={styles.statValue}>
            {new Date(stats.lastSync).toLocaleTimeString()}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSyncModal = () => (
    <Modal
      visible={showModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sync Status</Text>
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={styles.closeButton}
            >
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sync Statistics</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total Synced</Text>
                  <Text style={styles.statValue}>{stats.totalSynced}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Bandwidth Used</Text>
                  <Text style={styles.statValue}>
                    {(stats.bandwidthUsed / 1024 / 1024).toFixed(2)} MB
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Sync Duration</Text>
                  <Text style={styles.statValue}>
                    {(stats.syncDuration / 1000).toFixed(1)}s
                  </Text>
                </View>
              </View>
            </View>

            {queue.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pending Changes</Text>
                {queue.map(item => (
                  <View key={item.id} style={styles.queueItem}>
                    <Text style={styles.queueItemTitle}>
                      {item.type.toUpperCase()} - {item.entity}
                    </Text>
                    <Text style={styles.queueItemStatus}>
                      Status: {item.status}
                    </Text>
                    {item.lastError && (
                      <Text style={styles.queueItemError}>
                        Error: {item.lastError}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {conflicts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sync Conflicts</Text>
                {conflicts.map(conflict => (
                  <View key={conflict.id} style={styles.conflictItem}>
                    <Text style={styles.conflictTitle}>
                      Conflict in {conflict.entity}
                    </Text>
                    <View style={styles.conflictActions}>
                      <Button
                        title="Use Local"
                        variant="secondary"
                        onPress={() => handleConflictResolution('local')}
                        style={styles.conflictButton}
                      />
                      <Button
                        title="Use Remote"
                        variant="secondary"
                        onPress={() => handleConflictResolution('remote')}
                        style={styles.conflictButton}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {renderSyncButton()}
      {showDetails && renderSyncDetails()}
      {renderSyncModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    gap: 8,
  },
  syncingButton: {
    opacity: 0.7,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  rotatingIcon: {
    transform: [{ rotate: '45deg' }],
  },
  detailsContainer: {
    marginLeft: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  queueItem: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  queueItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  queueItemStatus: {
    fontSize: 14,
    color: '#666',
  },
  queueItemError: {
    fontSize: 14,
    color: '#f44336',
    marginTop: 4,
  },
  conflictItem: {
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  conflictTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  conflictActions: {
    flexDirection: 'row',
    gap: 8,
  },
  conflictButton: {
    flex: 1,
  },
}); 