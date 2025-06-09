import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icon';
import { WeatherService } from '../../services/integrations/WeatherService';
import { MarketDataService } from '../../services/integrations/MarketDataService';
import { VeterinaryService } from '../../services/integrations/VeterinaryService';
import { AccountingService } from '../../services/integrations/AccountingService';
import { SuppliersService } from '../../services/integrations/SuppliersService';

export const Integrations: React.FC = () => {
  const theme = useTheme();
  const [activeSection, setActiveSection] = useState<string>('weather');
  const [weatherPrefs, setWeatherPrefs] = useState<any>(null);
  const [marketPrefs, setMarketPrefs] = useState<any>(null);
  const [vetPrefs, setVetPrefs] = useState<any>(null);
  const [accountingPrefs, setAccountingPrefs] = useState<any>(null);
  const [supplierPrefs, setSupplierPrefs] = useState<any>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const weatherService = WeatherService.getInstance();
      const marketService = MarketDataService.getInstance();
      const vetService = VeterinaryService.getInstance();
      const accountingService = AccountingService.getInstance();
      const supplierService = SuppliersService.getInstance();

      const [weather, market, vet, accounting, supplier] = await Promise.all([
        weatherService.getPreferences(),
        marketService.getPreferences(),
        vetService.getPreferences(),
        accountingService.getPreferences(),
        supplierService.getPreferences(),
      ]);

      setWeatherPrefs(weather);
      setMarketPrefs(market);
      setVetPrefs(vet);
      setAccountingPrefs(accounting);
      setSupplierPrefs(supplier);
    } catch (error) {
      console.error('Error loading integration preferences:', error);
      Alert.alert('Error', 'Failed to load integration settings');
    }
  };

  const updateWeatherPreferences = async (updates: any) => {
    try {
      const weatherService = WeatherService.getInstance();
      await weatherService.updatePreferences(updates);
      setWeatherPrefs({ ...weatherPrefs, ...updates });
    } catch (error) {
      console.error('Error updating weather preferences:', error);
      Alert.alert('Error', 'Failed to update weather settings');
    }
  };

  const updateMarketPreferences = async (updates: any) => {
    try {
      const marketService = MarketDataService.getInstance();
      await marketService.updatePreferences(updates);
      setMarketPrefs({ ...marketPrefs, ...updates });
    } catch (error) {
      console.error('Error updating market preferences:', error);
      Alert.alert('Error', 'Failed to update market settings');
    }
  };

  const updateVetPreferences = async (updates: any) => {
    try {
      const vetService = VeterinaryService.getInstance();
      await vetService.updatePreferences(updates);
      setVetPrefs({ ...vetPrefs, ...updates });
    } catch (error) {
      console.error('Error updating veterinary preferences:', error);
      Alert.alert('Error', 'Failed to update veterinary settings');
    }
  };

  const updateAccountingPreferences = async (updates: any) => {
    try {
      const accountingService = AccountingService.getInstance();
      await accountingService.updatePreferences(updates);
      setAccountingPrefs({ ...accountingPrefs, ...updates });
    } catch (error) {
      console.error('Error updating accounting preferences:', error);
      Alert.alert('Error', 'Failed to update accounting settings');
    }
  };

  const updateSupplierPreferences = async (updates: any) => {
    try {
      const supplierService = SuppliersService.getInstance();
      await supplierService.updatePreferences(updates);
      setSupplierPrefs({ ...supplierPrefs, ...updates });
    } catch (error) {
      console.error('Error updating supplier preferences:', error);
      Alert.alert('Error', 'Failed to update supplier settings');
    }
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

  const renderWeatherSettings = () => (
    <Card style={styles.section}>
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>API Key</Text>
        <TextInput
          style={styles.input}
          value={weatherPrefs?.apiKey}
          onChangeText={(value) =>
            updateWeatherPreferences({ apiKey: value })
          }
          placeholder="Enter API key"
          secureTextEntry
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Units</Text>
        <View style={styles.settingControl}>
          <Button
            title="Metric"
            variant={weatherPrefs?.units === 'metric' ? 'primary' : 'secondary'}
            onPress={() => updateWeatherPreferences({ units: 'metric' })}
            style={styles.unitButton}
          />
          <Button
            title="Imperial"
            variant={weatherPrefs?.units === 'imperial' ? 'primary' : 'secondary'}
            onPress={() => updateWeatherPreferences({ units: 'imperial' })}
            style={styles.unitButton}
          />
        </View>
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Update Interval (minutes)</Text>
        <TextInput
          style={styles.input}
          value={weatherPrefs?.updateInterval?.toString()}
          onChangeText={(value) =>
            updateWeatherPreferences({ updateInterval: parseInt(value) || 30 })
          }
          keyboardType="numeric"
          placeholder="30"
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Weather Alerts</Text>
        <View style={styles.settingControl}>
          <Switch
            value={weatherPrefs?.alertsEnabled}
            onValueChange={(value) =>
              updateWeatherPreferences({ alertsEnabled: value })
            }
          />
        </View>
      </View>
    </Card>
  );

  const renderMarketSettings = () => (
    <Card style={styles.section}>
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>API Key</Text>
        <TextInput
          style={styles.input}
          value={marketPrefs?.apiKey}
          onChangeText={(value) =>
            updateMarketPreferences({ apiKey: value })
          }
          placeholder="Enter API key"
          secureTextEntry
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Update Interval (minutes)</Text>
        <TextInput
          style={styles.input}
          value={marketPrefs?.updateInterval?.toString()}
          onChangeText={(value) =>
            updateMarketPreferences({ updateInterval: parseInt(value) || 60 })
          }
          keyboardType="numeric"
          placeholder="60"
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Price Alerts</Text>
        <View style={styles.settingControl}>
          <Switch
            value={marketPrefs?.notifications?.enabled}
            onValueChange={(value) =>
              updateMarketPreferences({
                notifications: { ...marketPrefs?.notifications, enabled: value },
              })
            }
          />
        </View>
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Alert Threshold (%)</Text>
        <TextInput
          style={styles.input}
          value={marketPrefs?.notifications?.threshold?.toString()}
          onChangeText={(value) =>
            updateMarketPreferences({
              notifications: {
                ...marketPrefs?.notifications,
                threshold: parseFloat(value) || 5,
              },
            })
          }
          keyboardType="numeric"
          placeholder="5"
        />
      </View>
    </Card>
  );

  const renderVetSettings = () => (
    <Card style={styles.section}>
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>API Key</Text>
        <TextInput
          style={styles.input}
          value={vetPrefs?.apiKey}
          onChangeText={(value) =>
            updateVetPreferences({ apiKey: value })
          }
          placeholder="Enter API key"
          secureTextEntry
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Auto Schedule</Text>
        <View style={styles.settingControl}>
          <Switch
            value={vetPrefs?.autoSchedule}
            onValueChange={(value) =>
              updateVetPreferences({ autoSchedule: value })
            }
          />
        </View>
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Record Sharing</Text>
        <View style={styles.settingControl}>
          <Switch
            value={vetPrefs?.recordSharing?.enabled}
            onValueChange={(value) =>
              updateVetPreferences({
                recordSharing: { ...vetPrefs?.recordSharing, enabled: value },
              })
            }
          />
        </View>
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Consent Required</Text>
        <View style={styles.settingControl}>
          <Switch
            value={vetPrefs?.recordSharing?.consentRequired}
            onValueChange={(value) =>
              updateVetPreferences({
                recordSharing: {
                  ...vetPrefs?.recordSharing,
                  consentRequired: value,
                },
              })
            }
          />
        </View>
      </View>
    </Card>
  );

  const renderAccountingSettings = () => (
    <Card style={styles.section}>
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>API Key</Text>
        <TextInput
          style={styles.input}
          value={accountingPrefs?.apiKey}
          onChangeText={(value) =>
            updateAccountingPreferences({ apiKey: value })
          }
          placeholder="Enter API key"
          secureTextEntry
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Provider</Text>
        <View style={styles.settingControl}>
          <Button
            title="QuickBooks"
            variant={
              accountingPrefs?.provider === 'quickbooks' ? 'primary' : 'secondary'
            }
            onPress={() => updateAccountingPreferences({ provider: 'quickbooks' })}
            style={styles.providerButton}
          />
          <Button
            title="Xero"
            variant={accountingPrefs?.provider === 'xero' ? 'primary' : 'secondary'}
            onPress={() => updateAccountingPreferences({ provider: 'xero' })}
            style={styles.providerButton}
          />
          <Button
            title="Sage"
            variant={accountingPrefs?.provider === 'sage' ? 'primary' : 'secondary'}
            onPress={() => updateAccountingPreferences({ provider: 'sage' })}
            style={styles.providerButton}
          />
        </View>
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Sync Interval (minutes)</Text>
        <TextInput
          style={styles.input}
          value={accountingPrefs?.syncInterval?.toString()}
          onChangeText={(value) =>
            updateAccountingPreferences({ syncInterval: parseInt(value) || 60 })
          }
          keyboardType="numeric"
          placeholder="60"
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Automation</Text>
        <View style={styles.settingControl}>
          <Switch
            value={accountingPrefs?.automation?.enabled}
            onValueChange={(value) =>
              updateAccountingPreferences({
                automation: { ...accountingPrefs?.automation, enabled: value },
              })
            }
          />
        </View>
      </View>
    </Card>
  );

  const renderSupplierSettings = () => (
    <Card style={styles.section}>
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>API Key</Text>
        <TextInput
          style={styles.input}
          value={supplierPrefs?.apiKey}
          onChangeText={(value) =>
            updateSupplierPreferences({ apiKey: value })
          }
          placeholder="Enter API key"
          secureTextEntry
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Auto Reorder</Text>
        <View style={styles.settingControl}>
          <Switch
            value={supplierPrefs?.autoReorder}
            onValueChange={(value) =>
              updateSupplierPreferences({ autoReorder: value })
            }
          />
        </View>
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Low Stock Threshold</Text>
        <TextInput
          style={styles.input}
          value={supplierPrefs?.inventory?.lowStockThreshold?.toString()}
          onChangeText={(value) =>
            updateSupplierPreferences({
              inventory: {
                ...supplierPrefs?.inventory,
                lowStockThreshold: parseInt(value) || 20,
              },
            })
          }
          keyboardType="numeric"
          placeholder="20"
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Reorder Point</Text>
        <TextInput
          style={styles.input}
          value={supplierPrefs?.inventory?.reorderPoint?.toString()}
          onChangeText={(value) =>
            updateSupplierPreferences({
              inventory: {
                ...supplierPrefs?.inventory,
                reorderPoint: parseInt(value) || 10,
              },
            })
          }
          keyboardType="numeric"
          placeholder="10"
        />
      </View>
    </Card>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Integrations</Text>
      </View>

      {renderSectionHeader('Weather', 'cloud')}
      {activeSection === 'weather' && renderWeatherSettings()}

      {renderSectionHeader('Market Data', 'trending-up')}
      {activeSection === 'market data' && renderMarketSettings()}

      {renderSectionHeader('Veterinary', 'medical-services')}
      {activeSection === 'veterinary' && renderVetSettings()}

      {renderSectionHeader('Accounting', 'account-balance')}
      {activeSection === 'accounting' && renderAccountingSettings()}

      {renderSectionHeader('Suppliers', 'local-shipping')}
      {activeSection === 'suppliers' && renderSupplierSettings()}
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
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
  },
  unitButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  providerButton: {
    flex: 1,
    marginHorizontal: 4,
  },
}); 