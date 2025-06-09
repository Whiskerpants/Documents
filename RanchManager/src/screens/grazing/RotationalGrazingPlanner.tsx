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
  Share
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  GrazingPlan,
  Pasture,
  WeatherData,
  RotationEntry
} from '../../store/types/grazing';
import { MaterialIcons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { DragSortableView } from 'react-native-drag-sort';
import { LineChart } from 'react-native-chart-kit';
import { PDFDocument, rgb } from 'react-native-pdf-lib';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, addDays, differenceInDays } from 'date-fns';

// Types
interface PlanFormData {
  name: string;
  startDate: Date;
  endDate: Date;
  rotations: {
    pastureId: string;
    startDate: Date;
    endDate: Date;
    animalCount: number;
    animalType: string;
    notes?: string;
  }[];
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  notes?: string;
}

interface RotationMetrics {
  totalGrazingDays: number;
  averageRestPeriod: number;
  stockingDensity: number;
  forageUtilization: number;
}

// Constants
const OFFLINE_PLANS_KEY = 'offline_grazing_plans';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

const RotationalGrazingPlanner: React.FC = () => {
  // State
  const [formData, setFormData] = useState<PlanFormData>({
    name: '',
    startDate: new Date(),
    endDate: addDays(new Date(), 30),
    rotations: [],
    status: 'draft',
    notes: ''
  });
  const [selectedPlan, setSelectedPlan] = useState<GrazingPlan | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [metrics, setMetrics] = useState<RotationMetrics>({
    totalGrazingDays: 0,
    averageRestPeriod: 0,
    stockingDensity: 0,
    forageUtilization: 0
  });
  const [isOffline, setIsOffline] = useState(false);
  const [offlineChanges, setOfflineChanges] = useState<GrazingPlan[]>([]);

  // Redux
  const dispatch = useDispatch();
  const { grazingPlans, pastures, weatherData } = useSelector(
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

  useEffect(() => {
    if (selectedPlan) {
      calculateMetrics(selectedPlan);
    }
  }, [selectedPlan]);

  // Functions
  const checkConnectivity = async () => {
    const netInfo = await NetInfo.fetch();
    setIsOffline(!netInfo.isConnected);
  };

  const loadOfflineData = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(OFFLINE_PLANS_KEY);
      if (cachedData) {
        const { timestamp, data } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          setOfflineChanges(data);
        }
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  };

  const saveOfflineData = async (plan: GrazingPlan) => {
    try {
      const updatedChanges = [...offlineChanges, plan];
      const cacheData = {
        timestamp: Date.now(),
        data: updatedChanges
      };
      await AsyncStorage.setItem(OFFLINE_PLANS_KEY, JSON.stringify(cacheData));
      setOfflineChanges(updatedChanges);
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  };

  const syncOfflineChanges = async () => {
    // Implement offline sync logic here
  };

  const handleFormChange = (field: keyof PlanFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRotationReorder = (newRotations: {
    pastureId: string;
    startDate: Date;
    endDate: Date;
    animalCount: number;
    animalType: string;
    notes?: string;
  }[]) => {
    handleFormChange('rotations', newRotations);
  };

  const calculateMetrics = (plan: GrazingPlan) => {
    const totalDays = differenceInDays(
      plan.endDate,
      plan.startDate
    );
    const pastureCount = plan.rotations.length;
    const restPeriod = totalDays / pastureCount;

    const metrics: RotationMetrics = {
      totalGrazingDays: totalDays,
      averageRestPeriod: restPeriod,
      stockingDensity: calculateStockingDensity(plan),
      forageUtilization: calculateForageUtilization(plan)
    };

    setMetrics(metrics);
  };

  const calculateStockingDensity = (plan: GrazingPlan): number => {
    const totalAnimals = plan.rotations.reduce((sum, r) => sum + r.animalCount, 0);
    const totalArea = pastures.items
      .filter(p => plan.rotations.some(r => r.pastureId === p.id))
      .reduce((sum, p) => sum + p.area, 0);

    return totalAnimals / totalArea;
  };

  const calculateForageUtilization = (plan: GrazingPlan): number => {
    // Implement forage utilization calculation based on pasture data
    return 0.75; // Placeholder
  };

  const generateAISuggestions = async () => {
    // Implement AI-powered rotation suggestions
    const suggestions = {
      optimalSequence: pastures.items
        .sort((a, b) => b.area - a.area)
        .map(p => ({
          pastureId: p.id,
          startDate: new Date(),
          endDate: addDays(new Date(), 7),
          animalCount: Math.floor(p.carryingCapacity * 0.8),
          animalType: 'cattle',
          notes: 'AI-suggested rotation'
        })),
      warnings: [] as string[]
    };

    // Check for potential overgrazing
    const stockingDensity = calculateStockingDensity({
      id: 'temp',
      name: formData.name,
      startDate: formData.startDate,
      endDate: formData.endDate,
      rotations: formData.rotations,
      status: formData.status,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    if (stockingDensity > 2.0) {
      suggestions.warnings.push('High stocking density detected');
    }

    return suggestions;
  };

  const handleSavePlan = async () => {
    if (!formData.name || formData.rotations.length === 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const plan: GrazingPlan = {
      id: selectedPlan?.id || Date.now().toString(),
      name: formData.name,
      startDate: formData.startDate,
      endDate: formData.endDate,
      rotations: formData.rotations,
      status: formData.status,
      createdBy: 'user', // Replace with actual user ID
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (isOffline) {
      await saveOfflineData(plan);
      Alert.alert('Success', 'Plan saved offline');
    } else {
      // Dispatch to Redux store
      if (isEditing) {
        // Update existing plan
      } else {
        // Create new plan
      }
    }

    setIsEditing(false);
    setSelectedPlan(null);
    setFormData({
      name: '',
      startDate: new Date(),
      endDate: addDays(new Date(), 30),
      rotations: [],
      status: 'draft',
      notes: ''
    });
  };

  const handleShare = async () => {
    if (!selectedPlan) return;

    try {
      const result = await Share.share({
        message: `Grazing Plan: ${selectedPlan.name}\nStart: ${format(selectedPlan.startDate, 'yyyy-MM-dd')}\nEnd: ${format(selectedPlan.endDate, 'yyyy-MM-dd')}`,
        title: 'Share Grazing Plan'
      });
    } catch (error) {
      console.error('Error sharing plan:', error);
    }
  };

  const exportToPDF = async () => {
    if (!selectedPlan) return;

    try {
      const pdfDoc = await PDFDocument.create('grazing_plan.pdf');
      // Add content to PDF
      await pdfDoc.save();
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    }
  };

  // Render Functions
  const renderPlanForm = () => {
    return (
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Plan Name"
          value={formData.name}
          onChangeText={value => handleFormChange('name', value)}
        />
        <View style={styles.dateContainer}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              // Show date picker
            }}
          >
            <Text>Start Date: {format(formData.startDate, 'yyyy-MM-dd')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              // Show date picker
            }}
          >
            <Text>End Date: {format(formData.endDate, 'yyyy-MM-dd')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.sequenceContainer}>
          <Text style={styles.sectionTitle}>Rotation Sequence</Text>
          <DragSortableView
            dataSource={formData.rotations}
            parentWidth={Dimensions.get('window').width - 40}
            childrenHeight={50}
            marginChildrenTop={10}
            onDataChange={handleRotationReorder}
            keyExtractor={item => item.pastureId}
            renderItem={item => (
              <View style={styles.sequenceItem}>
                <Text>
                  {pastures.items.find(p => p.id === item.pastureId)?.name || 'Unknown Pasture'}
                </Text>
                <MaterialIcons name="drag-handle" size={24} color="#666" />
              </View>
            )}
          />
        </View>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Notes"
          multiline
          value={formData.notes}
          onChangeText={value => handleFormChange('notes', value)}
        />
      </View>
    );
  };

  const renderMetrics = () => {
    return (
      <View style={styles.metricsContainer}>
        <Text style={styles.sectionTitle}>Rotation Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{metrics.totalGrazingDays}</Text>
            <Text style={styles.metricLabel}>Total Days</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{metrics.averageRestPeriod.toFixed(1)}</Text>
            <Text style={styles.metricLabel}>Avg. Rest (days)</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{metrics.stockingDensity.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>Stocking Density</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{(metrics.forageUtilization * 100).toFixed(0)}%</Text>
            <Text style={styles.metricLabel}>Forage Utilization</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTimeline = () => {
    if (!selectedPlan) return null;

    const data = {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          data: [20, 45, 28, 80]
        }
      ]
    };

    return (
      <View style={styles.timelineContainer}>
        <Text style={styles.sectionTitle}>Rotation Timeline</Text>
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

  return (
    <ScrollView style={styles.container}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Offline Mode</Text>
        </View>
      )}
      {renderPlanForm()}
      {renderMetrics()}
      {renderTimeline()}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSavePlan}
        >
          <Text style={styles.buttonText}>Save Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.shareButton]}
          onPress={handleShare}
        >
          <Text style={styles.buttonText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.exportButton]}
          onPress={exportToPDF}
        >
          <Text style={styles.buttonText}>Export PDF</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  formContainer: {
    padding: 20
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4
  },
  sequenceContainer: {
    marginBottom: 16
  },
  sequenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top'
  },
  metricsContainer: {
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  metricItem: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center'
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3'
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  timelineContainer: {
    padding: 20
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center'
  },
  saveButton: {
    backgroundColor: '#4CAF50'
  },
  shareButton: {
    backgroundColor: '#2196F3'
  },
  exportButton: {
    backgroundColor: '#FF9800'
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
  }
});

export default RotationalGrazingPlanner; 