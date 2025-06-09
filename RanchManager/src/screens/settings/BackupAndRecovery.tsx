import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Text } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Icon } from '../../components/common/Icon';
import { BackupService, BackupConfig, BackupMetadata, RestoreOptions } from '../../services/BackupService';
import { formatDate, formatFileSize } from '../../utils/formatUtils';
import { RoleBasedAccess } from '../../components/auth/RoleBasedAccess';

export const BackupAndRecovery: React.FC = () => {
  const theme = useTheme();
  const backupService = BackupService.getInstance();
  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRestoreOptions, setShowRestoreOptions] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupMetadata | null>(null);
  const [restoreOptions, setRestoreOptions] = useState<RestoreOptions>({
    backupId: '',
    dataTypes: [],
    conflictResolution: 'skip',
    validateAfterRestore: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load backup configuration and history
      setLoading(false);
    } catch (error) {
      console.error('Error loading backup data:', error);
      Alert.alert('Error', 'Failed to load backup data');
    }
  };

  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      const metadata = await backupService.createBackup();
      setBackups((prev) => [metadata, ...prev]);
      Alert.alert('Success', 'Backup created successfully');
    } catch (error) {
      console.error('Error creating backup:', error);
      Alert.alert('Error', 'Failed to create backup');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async (newConfig: Partial<BackupConfig>) => {
    try {
      await backupService.updateConfig(newConfig);
      setConfig((prev) => ({ ...prev, ...newConfig }));
      Alert.alert('Success', 'Backup settings updated');
    } catch (error) {
      console.error('Error updating backup config:', error);
      Alert.alert('Error', 'Failed to update backup settings');
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;

    try {
      setLoading(true);
      await backupService.restoreBackup({
        ...restoreOptions,
        backupId: selectedBackup.id,
      });
      Alert.alert('Success', 'Data restored successfully');
      setShowRestoreOptions(false);
      setSelectedBackup(null);
    } catch (error) {
      console.error('Error restoring backup:', error);
      Alert.alert('Error', 'Failed to restore data');
    } finally {
      setLoading(false);
    }
  };

  const renderBackupCard = (backup: BackupMetadata) => (
    <Card key={backup.id} style={styles.backupCard}>
      <View style={styles.backupHeader}>
        <View>
          <Text style={styles.backupDate}>
            {formatDate(backup.timestamp)}
          </Text>
          <Text style={styles.backupSize}>
            {formatFileSize(backup.size)}
          </Text>
        </View>
        <View style={styles.backupStatus}>
          <Icon
            name={backup.status === 'completed' ? 'check-circle' : 'alert-circle'}
            size={24}
            color={
              backup.status === 'completed'
                ? theme.colors.success
                : theme.colors.error
            }
          />
        </View>
      </View>

      <View style={styles.backupDetails}>
        <Text style={styles.backupTypes}>
          Data Types: {backup.dataTypes.join(', ')}
        </Text>
        {backup.encryption.enabled && (
          <Text style={styles.encryptionInfo}>
            Encrypted ({backup.encryption.algorithm})
          </Text>
        )}
      </View>

      <View style={styles.backupActions}>
        <Button
          title="Restore"
          onPress={() => {
            setSelectedBackup(backup);
            setShowRestoreOptions(true);
          }}
          variant="secondary"
          icon="restore"
        />
        <Button
          title="Delete"
          onPress={() => {
            Alert.alert(
              'Confirm Delete',
              'Are you sure you want to delete this backup?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await backupService.deleteBackup(backup.id);
                      setBackups((prev) =>
                        prev.filter((b) => b.id !== backup.id)
                      );
                    } catch (error) {
                      console.error('Error deleting backup:', error);
                      Alert.alert('Error', 'Failed to delete backup');
                    }
                  },
                },
              ]
            );
          }}
          variant="danger"
          icon="trash"
        />
      </View>
    </Card>
  );

  const renderRestoreOptions = () => (
    <Card style={styles.restoreOptionsCard}>
      <Text style={styles.sectionTitle}>Restore Options</Text>

      <View style={styles.dataTypeSelector}>
        <Text style={styles.optionLabel}>Data Types to Restore:</Text>
        {selectedBackup?.dataTypes.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.dataTypeButton,
              restoreOptions.dataTypes.includes(type) &&
                styles.selectedDataType,
            ]}
            onPress={() => {
              setRestoreOptions((prev) => ({
                ...prev,
                dataTypes: prev.dataTypes.includes(type)
                  ? prev.dataTypes.filter((t) => t !== type)
                  : [...prev.dataTypes, type],
              }));
            }}
          >
            <Text>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.conflictResolution}>
        <Text style={styles.optionLabel}>Conflict Resolution:</Text>
        <View style={styles.radioGroup}>
          {['skip', 'overwrite', 'merge'].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.radioButton,
                restoreOptions.conflictResolution === option &&
                  styles.selectedRadio,
              ]}
              onPress={() =>
                setRestoreOptions((prev) => ({
                  ...prev,
                  conflictResolution: option as RestoreOptions['conflictResolution'],
                }))
              }
            >
              <Text>{option.charAt(0).toUpperCase() + option.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.validateOption}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() =>
            setRestoreOptions((prev) => ({
              ...prev,
              validateAfterRestore: !prev.validateAfterRestore,
            }))
          }
        >
          <Icon
            name={restoreOptions.validateAfterRestore ? 'check-square' : 'square'}
            size={24}
            color={theme.colors.primary}
          />
          <Text style={styles.checkboxLabel}>
            Validate data after restore
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.restoreActions}>
        <Button
          title="Cancel"
          onPress={() => {
            setShowRestoreOptions(false);
            setSelectedBackup(null);
          }}
          variant="secondary"
        />
        <Button
          title="Restore"
          onPress={handleRestoreBackup}
          disabled={restoreOptions.dataTypes.length === 0}
        />
      </View>
    </Card>
  );

  return (
    <RoleBasedAccess feature="backup_management">
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Backup & Recovery</Text>
          <Button
            title="Create Backup"
            onPress={handleCreateBackup}
            icon="backup"
            disabled={loading}
          />
        </View>

        <Card style={styles.configCard}>
          <Text style={styles.sectionTitle}>Backup Settings</Text>

          <View style={styles.settingGroup}>
            <Text style={styles.settingLabel}>Schedule</Text>
            <View style={styles.scheduleOptions}>
              <TouchableOpacity
                style={[
                  styles.scheduleButton,
                  config?.schedule.frequency === 'daily' &&
                    styles.selectedSchedule,
                ]}
                onPress={() =>
                  handleUpdateConfig({
                    schedule: { ...config?.schedule, frequency: 'daily' },
                  })
                }
              >
                <Text>Daily</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.scheduleButton,
                  config?.schedule.frequency === 'weekly' &&
                    styles.selectedSchedule,
                ]}
                onPress={() =>
                  handleUpdateConfig({
                    schedule: { ...config?.schedule, frequency: 'weekly' },
                  })
                }
              >
                <Text>Weekly</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.scheduleButton,
                  config?.schedule.frequency === 'monthly' &&
                    styles.selectedSchedule,
                ]}
                onPress={() =>
                  handleUpdateConfig({
                    schedule: { ...config?.schedule, frequency: 'monthly' },
                  })
                }
              >
                <Text>Monthly</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingGroup}>
            <Text style={styles.settingLabel}>Retention</Text>
            <View style={styles.retentionOptions}>
              <Text>Keep backups for:</Text>
              <View style={styles.retentionInput}>
                <TextInput
                  value={config?.retention.keepForDays.toString()}
                  onChangeText={(value) =>
                    handleUpdateConfig({
                      retention: {
                        ...config?.retention,
                        keepForDays: parseInt(value) || 0,
                      },
                    })
                  }
                  keyboardType="numeric"
                  style={styles.input}
                />
                <Text>days</Text>
              </View>
            </View>
          </View>

          <View style={styles.settingGroup}>
            <Text style={styles.settingLabel}>Data Types</Text>
            <View style={styles.dataTypeOptions}>
              {Object.entries(config?.dataTypes || {}).map(([type, enabled]) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.dataTypeButton,
                    enabled && styles.selectedDataType,
                  ]}
                  onPress={() =>
                    handleUpdateConfig({
                      dataTypes: {
                        ...config?.dataTypes,
                        [type]: !enabled,
                      },
                    })
                  }
                >
                  <Text>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Backup History</Text>
        {backups.map(renderBackupCard)}

        {showRestoreOptions && renderRestoreOptions()}
      </ScrollView>
    </RoleBasedAccess>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  configCard: {
    marginBottom: 24,
  },
  settingGroup: {
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scheduleOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  scheduleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectedSchedule: {
    backgroundColor: '#e0e0e0',
  },
  retentionOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retentionInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 4,
    width: 60,
  },
  dataTypeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dataTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectedDataType: {
    backgroundColor: '#e0e0e0',
  },
  backupCard: {
    marginBottom: 12,
  },
  backupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  backupDate: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  backupSize: {
    fontSize: 14,
    opacity: 0.7,
  },
  backupStatus: {
    padding: 4,
  },
  backupDetails: {
    marginTop: 8,
  },
  backupTypes: {
    fontSize: 14,
  },
  encryptionInfo: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  backupActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  restoreOptionsCard: {
    marginTop: 16,
    marginBottom: 24,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dataTypeSelector: {
    marginBottom: 16,
  },
  conflictResolution: {
    marginBottom: 16,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  radioButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectedRadio: {
    backgroundColor: '#e0e0e0',
  },
  validateOption: {
    marginBottom: 16,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 14,
  },
  restoreActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
}); 