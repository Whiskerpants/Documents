import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StyleSheet,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { updateFinancialSettings } from '../../store/reducers/financialReducer';
import { FinancialSettings, BudgetPeriodType } from '../../store/types/financial';
import { CustomPicker } from '../../components/common/CustomPicker';
import { useTheme } from '../../theme/ThemeContext';

const currencies = [
  { label: 'USD ($)', value: 'USD' },
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'GBP (£)', value: 'GBP' },
  { label: 'CAD ($)', value: 'CAD' },
  { label: 'AUD ($)', value: 'AUD' },
];

const dateFormats = [
  { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
  { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
  { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
];

const budgetAlertThresholds = [
  { label: '50%', value: 50 },
  { label: '60%', value: 60 },
  { label: '70%', value: 70 },
  { label: '80%', value: 80 },
  { label: '90%', value: 90 },
];

const archiveMonths = [
  { label: '6 months', value: 6 },
  { label: '12 months', value: 12 },
  { label: '18 months', value: 18 },
  { label: '24 months', value: 24 },
];

const budgetPeriods = [
  { label: 'Monthly', value: 'monthly' as BudgetPeriodType },
  { label: 'Quarterly', value: 'quarterly' as BudgetPeriodType },
  { label: 'Yearly', value: 'yearly' as BudgetPeriodType },
];

const reminderFrequencies = [
  { label: 'Daily', value: 'daily' as const },
  { label: 'Weekly', value: 'weekly' as const },
  { label: 'Monthly', value: 'monthly' as const },
];

export const FinancialSettingsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const settings = useSelector((state: RootState) => state.financial.settings);
  const [localSettings, setLocalSettings] = useState<FinancialSettings>(settings);

  const handleSave = () => {
    dispatch(updateFinancialSettings(localSettings));
    Alert.alert('Success', 'Settings saved successfully');
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Data',
      'Are you sure you want to clear all financial data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement clear data functionality
            Alert.alert('Success', 'All financial data has been cleared');
          },
        },
      ]
    );
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    Alert.alert('Success', 'Data exported successfully');
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    Alert.alert('Success', 'Data imported successfully');
  };

  const renderDisplaySettings = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Display Settings</Text>
      <View style={styles.setting}>
        <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Currency</Text>
        <CustomPicker
          selectedValue={localSettings.display.currency}
          onValueChange={(value) =>
            setLocalSettings({
              ...localSettings,
              display: { ...localSettings.display, currency: value },
            })
          }
          items={currencies}
          style={styles.picker}
        />
      </View>
      <View style={styles.setting}>
        <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Date Format</Text>
        <CustomPicker
          selectedValue={localSettings.display.dateFormat}
          onValueChange={(value) =>
            setLocalSettings({
              ...localSettings,
              display: { ...localSettings.display, dateFormat: value },
            })
          }
          items={dateFormats}
          style={styles.picker}
        />
      </View>
    </View>
  );

  const renderNotificationSettings = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Notification Settings</Text>
      <View style={styles.setting}>
        <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Budget Alerts</Text>
        <Switch
          value={localSettings.notifications.budgetAlerts}
          onValueChange={(value) =>
            setLocalSettings({
              ...localSettings,
              notifications: { ...localSettings.notifications, budgetAlerts: value },
            })
          }
        />
      </View>
      <View style={styles.setting}>
        <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Budget Alert Threshold</Text>
        <CustomPicker
          selectedValue={localSettings.notifications.budgetAlertThreshold}
          onValueChange={(value) =>
            setLocalSettings({
              ...localSettings,
              notifications: { ...localSettings.notifications, budgetAlertThreshold: value },
            })
          }
          items={budgetAlertThresholds}
          style={styles.picker}
        />
      </View>
    </View>
  );

  const renderDataManagement = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Data Management</Text>
      <View style={styles.setting}>
        <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Archive After</Text>
        <CustomPicker
          selectedValue={localSettings.dataManagement.archiveAfterMonths}
          onValueChange={(value) =>
            setLocalSettings({
              ...localSettings,
              dataManagement: { ...localSettings.dataManagement, archiveAfterMonths: value },
            })
          }
          items={archiveMonths}
          style={styles.picker}
        />
      </View>
      <View style={styles.setting}>
        <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Auto Archive</Text>
        <Switch
          value={localSettings.dataManagement.autoArchive}
          onValueChange={(value) =>
            setLocalSettings({
              ...localSettings,
              dataManagement: { ...localSettings.dataManagement, autoArchive: value },
            })
          }
        />
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={handleExport}>
          <Text style={styles.buttonText}>Export Data</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={handleImport}>
          <Text style={styles.buttonText}>Import Data</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.error }]}
          onPress={handleClearData}
        >
          <Text style={styles.buttonText}>Clear Data</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBudgetSettings = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Budget Settings</Text>
      <View style={styles.setting}>
        <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Default Period Type</Text>
        <CustomPicker
          selectedValue={localSettings.budget.defaultPeriodType}
          onValueChange={(value) =>
            setLocalSettings({
              ...localSettings,
              budget: { ...localSettings.budget, defaultPeriodType: value },
            })
          }
          items={budgetPeriods}
          style={styles.picker}
        />
      </View>
      <View style={styles.setting}>
        <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Auto Renewal</Text>
        <Switch
          value={localSettings.budget.autoRenewal}
          onValueChange={(value) =>
            setLocalSettings({
              ...localSettings,
              budget: { ...localSettings.budget, autoRenewal: value },
            })
          }
        />
      </View>
      <View style={styles.setting}>
        <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Reminder Frequency</Text>
        <CustomPicker
          selectedValue={localSettings.budget.reminderFrequency}
          onValueChange={(value) =>
            setLocalSettings({
              ...localSettings,
              budget: { ...localSettings.budget, reminderFrequency: value },
            })
          }
          items={reminderFrequencies}
          style={styles.picker}
        />
      </View>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderDisplaySettings()}
      {renderNotificationSettings()}
      {renderDataManagement()}
      {renderBudgetSettings()}
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>Save Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
  },
  picker: {
    width: 150,
  },
  buttonContainer: {
    marginTop: 16,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  saveButton: {
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 32,
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 