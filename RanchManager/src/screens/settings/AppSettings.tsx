import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icon';
import {
  PreferencesService,
  AppPreferences,
  ThemeMode,
  Language,
  SyncFrequency,
} from '../../services/PreferencesService';

export const AppSettings: React.FC = () => {
  const theme = useTheme();
  const preferencesService = PreferencesService.getInstance();
  const [preferences, setPreferences] = useState<AppPreferences | null>(null);
  const [activeSection, setActiveSection] = useState<string>('general');

  useEffect(() => {
    loadPreferences();
    const unsubscribe = preferencesService.onPreferencesUpdated((newPreferences) => {
      setPreferences(newPreferences);
    });
    return () => unsubscribe();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await preferencesService.getPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const updatePreferences = async (updates: Partial<AppPreferences>) => {
    try {
      await preferencesService.updatePreferences(updates);
    } catch (error) {
      console.error('Error updating preferences:', error);
      Alert.alert('Error', 'Failed to update preferences');
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Preferences',
      'Are you sure you want to reset all preferences to default values?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await preferencesService.resetPreferences();
            } catch (error) {
              console.error('Error resetting preferences:', error);
              Alert.alert('Error', 'Failed to reset preferences');
            }
          },
        },
      ]
    );
  };

  const renderSectionHeader = (title: string, icon: string) => (
    <TouchableOpacity
      style={[
        styles.sectionHeader,
        activeSection === title.toLowerCase() && styles.activeSection,
      ]}
      onPress={() => setActiveSection(title.toLowerCase())}
    >
      <Icon name={icon} size={24} color={theme.colors.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
      <Icon
        name={activeSection === title.toLowerCase() ? 'expand-less' : 'expand-more'}
        size={24}
        color={theme.colors.text}
      />
    </TouchableOpacity>
  );

  const renderGeneralSettings = () => (
    <Card style={styles.section}>
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Theme</Text>
        <View style={styles.settingControl}>
          <Button
            title="Light"
            variant={preferences?.general.theme === 'light' ? 'primary' : 'secondary'}
            onPress={() =>
              updatePreferences({
                general: { ...preferences?.general, theme: 'light' },
              })
            }
            style={styles.themeButton}
          />
          <Button
            title="Dark"
            variant={preferences?.general.theme === 'dark' ? 'primary' : 'secondary'}
            onPress={() =>
              updatePreferences({
                general: { ...preferences?.general, theme: 'dark' },
              })
            }
            style={styles.themeButton}
          />
          <Button
            title="System"
            variant={preferences?.general.theme === 'system' ? 'primary' : 'secondary'}
            onPress={() =>
              updatePreferences({
                general: { ...preferences?.general, theme: 'system' },
              })
            }
            style={styles.themeButton}
          />
        </View>
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Language</Text>
        <View style={styles.settingControl}>
          <Button
            title="English"
            variant={preferences?.general.language === 'en' ? 'primary' : 'secondary'}
            onPress={() =>
              updatePreferences({
                general: { ...preferences?.general, language: 'en' },
              })
            }
            style={styles.languageButton}
          />
          <Button
            title="Español"
            variant={preferences?.general.language === 'es' ? 'primary' : 'secondary'}
            onPress={() =>
              updatePreferences({
                general: { ...preferences?.general, language: 'es' },
              })
            }
            style={styles.languageButton}
          />
          <Button
            title="Français"
            variant={preferences?.general.language === 'fr' ? 'primary' : 'secondary'}
            onPress={() =>
              updatePreferences({
                general: { ...preferences?.general, language: 'fr' },
              })
            }
            style={styles.languageButton}
          />
        </View>
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Notifications</Text>
        <View style={styles.settingControl}>
          <Switch
            value={preferences?.general.notifications.enabled}
            onValueChange={(value) =>
              updatePreferences({
                general: {
                  ...preferences?.general,
                  notifications: {
                    ...preferences?.general.notifications,
                    enabled: value,
                  },
                },
              })
            }
          />
        </View>
      </View>
    </Card>
  );

  const renderModuleSettings = () => (
    <Card style={styles.section}>
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Cattle View</Text>
        <View style={styles.settingControl}>
          <Button
            title="List"
            variant={
              preferences?.modules.cattle.defaultView === 'list'
                ? 'primary'
                : 'secondary'
            }
            onPress={() =>
              updatePreferences({
                modules: {
                  ...preferences?.modules,
                  cattle: {
                    ...preferences?.modules.cattle,
                    defaultView: 'list',
                  },
                },
              })
            }
            style={styles.viewButton}
          />
          <Button
            title="Grid"
            variant={
              preferences?.modules.cattle.defaultView === 'grid'
                ? 'primary'
                : 'secondary'
            }
            onPress={() =>
              updatePreferences({
                modules: {
                  ...preferences?.modules,
                  cattle: {
                    ...preferences?.modules.cattle,
                    defaultView: 'grid',
                  },
                },
              })
            }
            style={styles.viewButton}
          />
          <Button
            title="Map"
            variant={
              preferences?.modules.cattle.defaultView === 'map'
                ? 'primary'
                : 'secondary'
            }
            onPress={() =>
              updatePreferences({
                modules: {
                  ...preferences?.modules,
                  cattle: {
                    ...preferences?.modules.cattle,
                    defaultView: 'map',
                  },
                },
              })
            }
            style={styles.viewButton}
          />
        </View>
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Health Alerts</Text>
        <View style={styles.settingControl}>
          <Switch
            value={preferences?.modules.health.autoSchedule}
            onValueChange={(value) =>
              updatePreferences({
                modules: {
                  ...preferences?.modules,
                  health: {
                    ...preferences?.modules.health,
                    autoSchedule: value,
                  },
                },
              })
            }
          />
        </View>
      </View>
    </Card>
  );

  const renderDataSettings = () => (
    <Card style={styles.section}>
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Sync Frequency</Text>
        <View style={styles.settingControl}>
          <Button
            title="Manual"
            variant={
              preferences?.data.sync.frequency === 'manual' ? 'primary' : 'secondary'
            }
            onPress={() =>
              updatePreferences({
                data: {
                  ...preferences?.data,
                  sync: {
                    ...preferences?.data.sync,
                    frequency: 'manual',
                  },
                },
              })
            }
            style={styles.syncButton}
          />
          <Button
            title="Hourly"
            variant={
              preferences?.data.sync.frequency === 'hourly' ? 'primary' : 'secondary'
            }
            onPress={() =>
              updatePreferences({
                data: {
                  ...preferences?.data,
                  sync: {
                    ...preferences?.data.sync,
                    frequency: 'hourly',
                  },
                },
              })
            }
            style={styles.syncButton}
          />
          <Button
            title="Daily"
            variant={
              preferences?.data.sync.frequency === 'daily' ? 'primary' : 'secondary'
            }
            onPress={() =>
              updatePreferences({
                data: {
                  ...preferences?.data,
                  sync: {
                    ...preferences?.data.sync,
                    frequency: 'daily',
                  },
                },
              })
            }
            style={styles.syncButton}
          />
        </View>
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Sync on Cellular</Text>
        <View style={styles.settingControl}>
          <Switch
            value={preferences?.data.sync.onCellular}
            onValueChange={(value) =>
              updatePreferences({
                data: {
                  ...preferences?.data,
                  sync: {
                    ...preferences?.data.sync,
                    onCellular: value,
                  },
                },
              })
            }
          />
        </View>
      </View>
    </Card>
  );

  const renderPerformanceSettings = () => (
    <Card style={styles.section}>
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Background Sync</Text>
        <View style={styles.settingControl}>
          <Switch
            value={preferences?.performance.dataRefresh.backgroundSync}
            onValueChange={(value) =>
              updatePreferences({
                performance: {
                  ...preferences?.performance,
                  dataRefresh: {
                    ...preferences?.performance.dataRefresh,
                    backgroundSync: value,
                  },
                },
              })
            }
          />
        </View>
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Animations</Text>
        <View style={styles.settingControl}>
          <Switch
            value={preferences?.performance.animations.enabled}
            onValueChange={(value) =>
              updatePreferences({
                performance: {
                  ...preferences?.performance,
                  animations: {
                    ...preferences?.performance.animations,
                    enabled: value,
                  },
                },
              })
            }
          />
        </View>
      </View>
    </Card>
  );

  const renderPrivacySettings = () => (
    <Card style={styles.section}>
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Biometric Authentication</Text>
        <View style={styles.settingControl}>
          <Switch
            value={preferences?.privacy.security.biometricAuth}
            onValueChange={(value) =>
              updatePreferences({
                privacy: {
                  ...preferences?.privacy,
                  security: {
                    ...preferences?.privacy.security,
                    biometricAuth: value,
                  },
                },
              })
            }
          />
        </View>
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Analytics</Text>
        <View style={styles.settingControl}>
          <Switch
            value={preferences?.privacy.dataSharing.analytics}
            onValueChange={(value) =>
              updatePreferences({
                privacy: {
                  ...preferences?.privacy,
                  dataSharing: {
                    ...preferences?.privacy.dataSharing,
                    analytics: value,
                  },
                },
              })
            }
          />
        </View>
      </View>
    </Card>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Button
          title="Reset All"
          variant="secondary"
          onPress={handleReset}
          style={styles.resetButton}
        />
      </View>

      {renderSectionHeader('General', 'settings')}
      {activeSection === 'general' && renderGeneralSettings()}

      {renderSectionHeader('Modules', 'apps')}
      {activeSection === 'modules' && renderModuleSettings()}

      {renderSectionHeader('Data', 'storage')}
      {activeSection === 'data' && renderDataSettings()}

      {renderSectionHeader('Performance', 'speed')}
      {activeSection === 'performance' && renderPerformanceSettings()}

      {renderSectionHeader('Privacy', 'security')}
      {activeSection === 'privacy' && renderPrivacySettings()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  resetButton: {
    minWidth: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  activeSection: {
    backgroundColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 16,
  },
  settingItem: {
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  settingControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  languageButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  viewButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  syncButton: {
    flex: 1,
    marginHorizontal: 4,
  },
}); 