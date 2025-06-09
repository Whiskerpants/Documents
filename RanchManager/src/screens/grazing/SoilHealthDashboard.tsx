import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Dimensions,
  Image,
  ActivityIndicator
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  SoilHealthScore,
  SoilSample,
  CarbonSequestration,
  Pasture,
  SoilType
} from '../../store/types/grazing';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import MapView, { Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, subMonths } from 'date-fns';

// Types
interface SoilTestFormData {
  pastureId: string;
  date: Date;
  location: {
    latitude: number;
    longitude: number;
  };
  depth: number;
  metrics: {
    ph: number;
    organicMatter: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    carbon: number;
    bulkDensity: number;
    waterHoldingCapacity: number;
  };
  notes?: string;
  photos?: string[];
}

interface SoilHealthInsights {
  recommendations: string[];
  timeline: {
    metric: string;
    current: number;
    target: number;
    monthsToTarget: number;
  }[];
  carbonCredits: {
    current: number;
    potential: number;
    value: number;
  };
}

// Constants
const OFFLINE_SAMPLES_KEY = 'offline_soil_samples';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const CHART_COLORS = {
  primary: '#2196F3',
  secondary: '#4CAF50',
  warning: '#FFC107',
  danger: '#F44336'
};

const SoilHealthDashboard: React.FC = () => {
  // State
  const [selectedPasture, setSelectedPasture] = useState<Pasture | null>(null);
  const [timeRange, setTimeRange] = useState<'1m' | '3m' | '6m' | '1y'>('3m');
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [offlineSamples, setOfflineSamples] = useState<SoilSample[]>([]);
  const [formData, setFormData] = useState<SoilTestFormData>({
    pastureId: '',
    date: new Date(),
    location: { latitude: 0, longitude: 0 },
    depth: 15,
    metrics: {
      ph: 0,
      organicMatter: 0,
      nitrogen: 0,
      phosphorus: 0,
      potassium: 0,
      carbon: 0,
      bulkDensity: 0,
      waterHoldingCapacity: 0
    }
  });

  // Redux
  const dispatch = useDispatch();
  const { soilHealthScores, soilSamples, carbonSequestration, pastures } = useSelector(
    (state: RootState) => state.grazing
  );

  // Effects
  useEffect(() => {
    checkConnectivity();
    loadOfflineData();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
      if (state.isConnected) {
        syncOfflineChanges();
      }
    });

    return () => unsubscribe();
  }, []);

  // Functions
  const checkConnectivity = async () => {
    const netInfo = await NetInfo.fetch();
    setIsOffline(!netInfo.isConnected);
  };

  const loadOfflineData = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(OFFLINE_SAMPLES_KEY);
      if (cachedData) {
        const { timestamp, data } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          setOfflineSamples(data);
        }
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  };

  const saveOfflineData = async (sample: SoilSample) => {
    try {
      const updatedSamples = [...offlineSamples, sample];
      const cacheData = {
        timestamp: Date.now(),
        data: updatedSamples
      };
      await AsyncStorage.setItem(OFFLINE_SAMPLES_KEY, JSON.stringify(cacheData));
      setOfflineSamples(updatedSamples);
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  };

  const syncOfflineChanges = async () => {
    // Implement offline sync logic here
  };

  const handleFormChange = (field: keyof SoilTestFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMetricsChange = (field: keyof SoilTestFormData['metrics'], value: number) => {
    setFormData(prev => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        [field]: value
      }
    }));
  };

  const handlePhotoUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8
      });

      if (!result.canceled) {
        const newPhotos = [...(formData.photos || []), result.assets[0].uri];
        handleFormChange('photos', newPhotos);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo');
    }
  };

  const calculateSoilHealthScore = (sample: SoilSample): number => {
    const weights = {
      organicMatter: 0.3,
      ph: 0.15,
      nitrogen: 0.15,
      phosphorus: 0.1,
      potassium: 0.1,
      carbon: 0.1,
      waterHoldingCapacity: 0.1
    };

    const scores = {
      organicMatter: Math.min(sample.metrics.organicMatter / 5, 1) * 100,
      ph: sample.metrics.ph >= 6 && sample.metrics.ph <= 7.5 ? 100 : 50,
      nitrogen: Math.min(sample.metrics.nitrogen / 200, 1) * 100,
      phosphorus: Math.min(sample.metrics.phosphorus / 50, 1) * 100,
      potassium: Math.min(sample.metrics.potassium / 200, 1) * 100,
      carbon: Math.min(sample.metrics.carbon / 3, 1) * 100,
      waterHoldingCapacity: Math.min(sample.metrics.waterHoldingCapacity / 30, 1) * 100
    };

    return Object.entries(weights).reduce(
      (total, [key, weight]) => total + scores[key as keyof typeof scores] * weight,
      0
    );
  };

  const generateInsights = (scores: SoilHealthScore[]): SoilHealthInsights => {
    const latestScore = scores[scores.length - 1];
    const recommendations: string[] = [];
    const timeline: SoilHealthInsights['timeline'] = [];
    const carbonCredits = {
      current: 0,
      potential: 0,
      value: 0
    };

    // Generate recommendations based on metrics
    if (latestScore.components.organicMatter < 3) {
      recommendations.push('Increase organic matter through cover cropping and reduced tillage');
    }
    if (latestScore.components.biologicalActivity < 50) {
      recommendations.push('Improve biological activity with compost application');
    }
    if (latestScore.components.waterInfiltration < 60) {
      recommendations.push('Enhance water infiltration through soil structure improvement');
    }

    // Calculate timeline to targets
    timeline.push({
      metric: 'Organic Matter',
      current: latestScore.components.organicMatter,
      target: 5,
      monthsToTarget: Math.ceil((5 - latestScore.components.organicMatter) * 6)
    });

    // Calculate carbon credit potential
    const currentCarbon = carbonSequestration.items.reduce(
      (sum, item) => sum + item.metrics.totalSequestration,
      0
    );
    const potentialCarbon = currentCarbon * 1.5; // Assuming 50% improvement potential
    carbonCredits.current = currentCarbon;
    carbonCredits.potential = potentialCarbon;
    carbonCredits.value = potentialCarbon * 50; // Assuming $50 per ton of CO2

    return {
      recommendations,
      timeline,
      carbonCredits
    };
  };

  const handleSaveSample = async () => {
    if (!formData.pastureId) {
      Alert.alert('Error', 'Please select a pasture');
      return;
    }

    setIsLoading(true);
    try {
      const sample: SoilSample = {
        id: Date.now().toString(),
        pastureId: formData.pastureId,
        date: formData.date,
        location: formData.location,
        depth: formData.depth,
        metrics: formData.metrics,
        notes: formData.notes,
        createdBy: 'user', // Replace with actual user ID
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (isOffline) {
        await saveOfflineData(sample);
        Alert.alert('Success', 'Sample saved offline');
      } else {
        // Dispatch to Redux store
      }

      // Reset form
      setFormData({
        pastureId: '',
        date: new Date(),
        location: { latitude: 0, longitude: 0 },
        depth: 15,
        metrics: {
          ph: 0,
          organicMatter: 0,
          nitrogen: 0,
          phosphorus: 0,
          potassium: 0,
          carbon: 0,
          bulkDensity: 0,
          waterHoldingCapacity: 0
        }
      });
    } catch (error) {
      console.error('Error saving sample:', error);
      Alert.alert('Error', 'Failed to save sample');
    } finally {
      setIsLoading(false);
    }
  };

  // Render Functions
  const renderSummaryCards = () => {
    const latestScore = soilHealthScores.items[soilHealthScores.items.length - 1];
    if (!latestScore) return null;

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Overall Health</Text>
          <Text style={styles.summaryValue}>{latestScore.score.toFixed(0)}</Text>
          <Text style={styles.summaryLabel}>Score</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Organic Matter</Text>
          <Text style={styles.summaryValue}>{latestScore.components.organicMatter.toFixed(1)}%</Text>
          <Text style={styles.summaryLabel}>Content</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Carbon Sequestration</Text>
          <Text style={styles.summaryValue}>
            {carbonSequestration.items.reduce(
              (sum, item) => sum + item.metrics.totalSequestration,
              0
            ).toFixed(1)}
          </Text>
          <Text style={styles.summaryLabel}>Tons CO2e</Text>
        </View>
      </View>
    );
  };

  const renderTrendCharts = () => {
    const timeFilteredScores = soilHealthScores.items.filter(score => {
      const scoreDate = new Date(score.date);
      const cutoffDate = subMonths(new Date(), timeRange === '1m' ? 1 : timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12);
      return scoreDate >= cutoffDate;
    });

    const data = {
      labels: timeFilteredScores.map(score => format(new Date(score.date), 'MMM d')),
      datasets: [
        {
          data: timeFilteredScores.map(score => score.score)
        }
      ]
    };

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Soil Health Trends</Text>
          <View style={styles.timeRangeSelector}>
            {(['1m', '3m', '6m', '1y'] as const).map(range => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.timeRangeButton,
                  timeRange === range && styles.timeRangeButtonActive
                ]}
                onPress={() => setTimeRange(range)}
              >
                <Text
                  style={[
                    styles.timeRangeText,
                    timeRange === range && styles.timeRangeTextActive
                  ]}
                >
                  {range.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <LineChart
          data={data}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
            style: {
              borderRadius: 16
            }
          }}
          style={styles.chart}
        />
      </View>
    );
  };

  const renderMapView = () => {
    return (
      <View style={styles.mapContainer}>
        <Text style={styles.sectionTitle}>Soil Health by Pasture</Text>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: pastures.items[0]?.boundaries[0]?.latitude || 0,
            longitude: pastures.items[0]?.boundaries[0]?.longitude || 0,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421
          }}
        >
          {pastures.items.map(pasture => {
            const latestScore = soilHealthScores.items
              .filter(score => score.pastureId === pasture.id)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

            const fillColor = latestScore
              ? `rgba(33, 150, 243, ${latestScore.score / 100})`
              : 'rgba(128, 128, 128, 0.3)';

            return (
              <Polygon
                key={pasture.id}
                coordinates={pasture.boundaries}
                fillColor={fillColor}
                strokeColor="#666"
                strokeWidth={2}
                tappable
                onPress={() => setSelectedPasture(pasture)}
              />
            );
          })}
        </MapView>
      </View>
    );
  };

  const renderTestResults = () => {
    const latestSamples = soilSamples.items
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.sectionTitle}>Recent Soil Tests</Text>
        {latestSamples.map(sample => (
          <View key={sample.id} style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultDate}>
                {format(new Date(sample.date), 'MMM d, yyyy')}
              </Text>
              <Text style={styles.resultPasture}>
                {pastures.items.find(p => p.id === sample.pastureId)?.name || 'Unknown Pasture'}
              </Text>
            </View>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>pH</Text>
                <Text style={styles.metricValue}>{sample.metrics.ph.toFixed(1)}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>OM</Text>
                <Text style={styles.metricValue}>{sample.metrics.organicMatter.toFixed(1)}%</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>N</Text>
                <Text style={styles.metricValue}>{sample.metrics.nitrogen.toFixed(0)}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>P</Text>
                <Text style={styles.metricValue}>{sample.metrics.phosphorus.toFixed(0)}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>K</Text>
                <Text style={styles.metricValue}>{sample.metrics.potassium.toFixed(0)}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderInsights = () => {
    const insights = generateInsights(soilHealthScores.items);

    return (
      <View style={styles.insightsContainer}>
        <Text style={styles.sectionTitle}>Actionable Insights</Text>
        <View style={styles.recommendationsContainer}>
          <Text style={styles.insightSubtitle}>Recommendations</Text>
          {insights.recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendationItem}>
              <MaterialIcons name="lightbulb" size={24} color="#FFC107" />
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>
        <View style={styles.timelineContainer}>
          <Text style={styles.insightSubtitle}>Improvement Timeline</Text>
          {insights.timeline.map((item, index) => (
            <View key={index} style={styles.timelineItem}>
              <Text style={styles.timelineMetric}>{item.metric}</Text>
              <View style={styles.timelineProgress}>
                <View
                  style={[
                    styles.timelineBar,
                    { width: `${(item.current / item.target) * 100}%` }
                  ]}
                />
              </View>
              <Text style={styles.timelineMonths}>{item.monthsToTarget} months to target</Text>
            </View>
          ))}
        </View>
        <View style={styles.carbonContainer}>
          <Text style={styles.insightSubtitle}>Carbon Credit Potential</Text>
          <View style={styles.carbonMetrics}>
            <View style={styles.carbonMetric}>
              <Text style={styles.carbonLabel}>Current</Text>
              <Text style={styles.carbonValue}>
                {insights.carbonCredits.current.toFixed(1)} tons
              </Text>
            </View>
            <View style={styles.carbonMetric}>
              <Text style={styles.carbonLabel}>Potential</Text>
              <Text style={styles.carbonValue}>
                {insights.carbonCredits.potential.toFixed(1)} tons
              </Text>
            </View>
            <View style={styles.carbonMetric}>
              <Text style={styles.carbonLabel}>Value</Text>
              <Text style={styles.carbonValue}>
                ${insights.carbonCredits.value.toFixed(0)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderTestForm = () => {
    return (
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Add Soil Test</Text>
        <View style={styles.formRow}>
          <TextInput
            style={styles.input}
            placeholder="pH"
            keyboardType="numeric"
            value={formData.metrics.ph.toString()}
            onChangeText={value => handleMetricsChange('ph', parseFloat(value) || 0)}
          />
          <TextInput
            style={styles.input}
            placeholder="Organic Matter %"
            keyboardType="numeric"
            value={formData.metrics.organicMatter.toString()}
            onChangeText={value =>
              handleMetricsChange('organicMatter', parseFloat(value) || 0)
            }
          />
        </View>
        <View style={styles.formRow}>
          <TextInput
            style={styles.input}
            placeholder="Nitrogen (mg/kg)"
            keyboardType="numeric"
            value={formData.metrics.nitrogen.toString()}
            onChangeText={value => handleMetricsChange('nitrogen', parseFloat(value) || 0)}
          />
          <TextInput
            style={styles.input}
            placeholder="Phosphorus (mg/kg)"
            keyboardType="numeric"
            value={formData.metrics.phosphorus.toString()}
            onChangeText={value =>
              handleMetricsChange('phosphorus', parseFloat(value) || 0)
            }
          />
        </View>
        <View style={styles.formRow}>
          <TextInput
            style={styles.input}
            placeholder="Potassium (mg/kg)"
            keyboardType="numeric"
            value={formData.metrics.potassium.toString()}
            onChangeText={value =>
              handleMetricsChange('potassium', parseFloat(value) || 0)
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Carbon %"
            keyboardType="numeric"
            value={formData.metrics.carbon.toString()}
            onChangeText={value => handleMetricsChange('carbon', parseFloat(value) || 0)}
          />
        </View>
        <TouchableOpacity
          style={styles.photoButton}
          onPress={handlePhotoUpload}
        >
          <MaterialIcons name="photo-camera" size={24} color="#fff" />
          <Text style={styles.photoButtonText}>Add Photos</Text>
        </TouchableOpacity>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Notes"
          multiline
          value={formData.notes}
          onChangeText={value => handleFormChange('notes', value)}
        />
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSaveSample}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Test Results</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Offline Mode</Text>
        </View>
      )}
      {renderSummaryCards()}
      {renderTrendCharts()}
      {renderMapView()}
      {renderTestResults()}
      {renderInsights()}
      {renderTestForm()}
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center'
  },
  summaryTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3'
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  chartContainer: {
    padding: 20
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  timeRangeSelector: {
    flexDirection: 'row'
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
    backgroundColor: '#f5f5f5'
  },
  timeRangeButtonActive: {
    backgroundColor: '#2196F3'
  },
  timeRangeText: {
    fontSize: 12,
    color: '#666'
  },
  timeRangeTextActive: {
    color: '#fff'
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16
  },
  mapContainer: {
    padding: 20
  },
  map: {
    height: 300,
    borderRadius: 8,
    marginTop: 16
  },
  resultsContainer: {
    padding: 20
  },
  resultCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  resultDate: {
    fontSize: 14,
    color: '#666'
  },
  resultPasture: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  metricItem: {
    width: '18%',
    alignItems: 'center'
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3'
  },
  insightsContainer: {
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  insightSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12
  },
  recommendationsContainer: {
    marginBottom: 24
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  recommendationText: {
    marginLeft: 8,
    flex: 1
  },
  timelineContainer: {
    marginBottom: 24
  },
  timelineItem: {
    marginBottom: 12
  },
  timelineMetric: {
    fontSize: 14,
    marginBottom: 4
  },
  timelineProgress: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden'
  },
  timelineBar: {
    height: '100%',
    backgroundColor: '#4CAF50'
  },
  timelineMonths: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  carbonContainer: {
    marginBottom: 24
  },
  carbonMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  carbonMetric: {
    alignItems: 'center'
  },
  carbonLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  carbonValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3'
  },
  formContainer: {
    padding: 20
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    fontSize: 16
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  photoButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 16
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center'
  },
  saveButton: {
    backgroundColor: '#4CAF50'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  offlineBanner: {
    backgroundColor: '#F44336',
    padding: 8,
    alignItems: 'center'
  },
  offlineText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16
  }
});

export default SoilHealthDashboard; 