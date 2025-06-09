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
  ActivityIndicator,
  Switch
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import Slider from '@react-native-community/slider';
import { PDFDocument, rgb } from 'react-native-pdf-lib';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, addMonths, differenceInMonths } from 'date-fns';

// Types
interface ImplementationCosts {
  fencing: number;
  waterInfrastructure: number;
  seeds: number;
  equipment: number;
  labor: number;
  other: number;
}

interface OperationalSavings {
  feed: number;
  fertilizer: number;
  vetCosts: number;
  fuel: number;
  other: number;
}

interface ProductivityGains {
  weightGain: number;
  stockingRate: number;
  forageProduction: number;
  animalHealth: number;
}

interface Scenario {
  id: string;
  name: string;
  implementationCosts: ImplementationCosts;
  operationalSavings: OperationalSavings;
  productivityGains: ProductivityGains;
  carbonPrice: number;
  timeline: number;
  weatherRisk: number;
  createdAt: Date;
  updatedAt: Date;
}

interface EconomicMetrics {
  totalInvestment: number;
  annualSavings: number;
  breakevenMonths: number;
  fiveYearROI: number;
  carbonRevenue: number;
  netPresentValue: number;
}

// Constants
const SCENARIOS_KEY = 'economic_scenarios';
const CARBON_PRICE_RANGE = { min: 20, max: 100 };
const TIMELINE_RANGE = { min: 12, max: 60 };
const WEATHER_RISK_RANGE = { min: 0, max: 100 };

const EconomicImpactCalculator: React.FC = () => {
  // State
  const [currentScenario, setCurrentScenario] = useState<Scenario>({
    id: Date.now().toString(),
    name: 'Base Scenario',
    implementationCosts: {
      fencing: 0,
      waterInfrastructure: 0,
      seeds: 0,
      equipment: 0,
      labor: 0,
      other: 0
    },
    operationalSavings: {
      feed: 0,
      fertilizer: 0,
      vetCosts: 0,
      fuel: 0,
      other: 0
    },
    productivityGains: {
      weightGain: 0,
      stockingRate: 0,
      forageProduction: 0,
      animalHealth: 0
    },
    carbonPrice: 50,
    timeline: 36,
    weatherRisk: 30,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const [savedScenarios, setSavedScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showEducational, setShowEducational] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1y' | '3y' | '5y'>('3y');

  // Effects
  useEffect(() => {
    loadSavedScenarios();
  }, []);

  // Functions
  const loadSavedScenarios = async () => {
    try {
      const scenarios = await AsyncStorage.getItem(SCENARIOS_KEY);
      if (scenarios) {
        setSavedScenarios(JSON.parse(scenarios));
      }
    } catch (error) {
      console.error('Error loading scenarios:', error);
    }
  };

  const saveScenario = async () => {
    try {
      const updatedScenarios = [...savedScenarios, currentScenario];
      await AsyncStorage.setItem(SCENARIOS_KEY, JSON.stringify(updatedScenarios));
      setSavedScenarios(updatedScenarios);
      Alert.alert('Success', 'Scenario saved successfully');
    } catch (error) {
      console.error('Error saving scenario:', error);
      Alert.alert('Error', 'Failed to save scenario');
    }
  };

  const calculateMetrics = (scenario: Scenario): EconomicMetrics => {
    const totalInvestment = Object.values(scenario.implementationCosts).reduce(
      (sum, cost) => sum + cost,
      0
    );

    const annualSavings = Object.values(scenario.operationalSavings).reduce(
      (sum, saving) => sum + saving,
      0
    );

    const productivityValue = calculateProductivityValue(scenario.productivityGains);
    const carbonRevenue = calculateCarbonRevenue(scenario);
    const totalAnnualBenefit = annualSavings + productivityValue + carbonRevenue;

    const breakevenMonths = Math.ceil(totalInvestment / (totalAnnualBenefit / 12));
    const fiveYearROI = ((totalAnnualBenefit * 5 - totalInvestment) / totalInvestment) * 100;
    const netPresentValue = calculateNPV(totalInvestment, totalAnnualBenefit, 5);

    return {
      totalInvestment,
      annualSavings,
      breakevenMonths,
      fiveYearROI,
      carbonRevenue,
      netPresentValue
    };
  };

  const calculateProductivityValue = (gains: ProductivityGains): number => {
    // Placeholder calculations - replace with actual formulas
    const weightGainValue = gains.weightGain * 2.5; // $2.50 per pound
    const stockingRateValue = gains.stockingRate * 1000; // $1000 per head
    const forageValue = gains.forageProduction * 50; // $50 per ton
    const healthValue = gains.animalHealth * 500; // $500 per animal

    return weightGainValue + stockingRateValue + forageValue + healthValue;
  };

  const calculateCarbonRevenue = (scenario: Scenario): number => {
    // Placeholder calculation - replace with actual carbon sequestration model
    const annualSequestration = 2.5; // tons CO2e per acre
    const acres = 1000; // placeholder
    return annualSequestration * acres * scenario.carbonPrice;
  };

  const calculateNPV = (
    initialInvestment: number,
    annualBenefit: number,
    years: number
  ): number => {
    const discountRate = 0.05; // 5% discount rate
    let npv = -initialInvestment;

    for (let i = 1; i <= years; i++) {
      npv += annualBenefit / Math.pow(1 + discountRate, i);
    }

    return npv;
  };

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const metrics = calculateMetrics(currentScenario);
      const pdfDoc = await PDFDocument.create('economic_analysis.pdf');

      // Add content to PDF
      await pdfDoc.save();
      Alert.alert('Success', 'Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  // Render Functions
  const renderCostInputs = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Implementation Costs</Text>
        {Object.entries(currentScenario.implementationCosts).map(([key, value]) => (
          <View key={key} style={styles.inputRow}>
            <Text style={styles.inputLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={value.toString()}
              onChangeText={text => {
                setCurrentScenario(prev => ({
                  ...prev,
                  implementationCosts: {
                    ...prev.implementationCosts,
                    [key]: parseFloat(text) || 0
                  }
                }));
              }}
            />
          </View>
        ))}
      </View>
    );
  };

  const renderSavingsInputs = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Operational Savings</Text>
        {Object.entries(currentScenario.operationalSavings).map(([key, value]) => (
          <View key={key} style={styles.inputRow}>
            <Text style={styles.inputLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={value.toString()}
              onChangeText={text => {
                setCurrentScenario(prev => ({
                  ...prev,
                  operationalSavings: {
                    ...prev.operationalSavings,
                    [key]: parseFloat(text) || 0
                  }
                }));
              }}
            />
          </View>
        ))}
      </View>
    );
  };

  const renderProductivityInputs = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Productivity Gains</Text>
        {Object.entries(currentScenario.productivityGains).map(([key, value]) => (
          <View key={key} style={styles.inputRow}>
            <Text style={styles.inputLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={value}
              onValueChange={newValue => {
                setCurrentScenario(prev => ({
                  ...prev,
                  productivityGains: {
                    ...prev.productivityGains,
                    [key]: newValue
                  }
                }));
              }}
            />
            <Text style={styles.sliderValue}>{value.toFixed(0)}%</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderScenarioControls = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scenario Parameters</Text>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Carbon Price ($/ton)</Text>
          <Slider
            style={styles.slider}
            minimumValue={CARBON_PRICE_RANGE.min}
            maximumValue={CARBON_PRICE_RANGE.max}
            value={currentScenario.carbonPrice}
            onValueChange={value => {
              setCurrentScenario(prev => ({
                ...prev,
                carbonPrice: value
              }));
            }}
          />
          <Text style={styles.sliderValue}>${currentScenario.carbonPrice.toFixed(0)}</Text>
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Implementation Timeline (months)</Text>
          <Slider
            style={styles.slider}
            minimumValue={TIMELINE_RANGE.min}
            maximumValue={TIMELINE_RANGE.max}
            value={currentScenario.timeline}
            onValueChange={value => {
              setCurrentScenario(prev => ({
                ...prev,
                timeline: value
              }));
            }}
          />
          <Text style={styles.sliderValue}>{currentScenario.timeline.toFixed(0)}</Text>
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Weather Risk Factor</Text>
          <Slider
            style={styles.slider}
            minimumValue={WEATHER_RISK_RANGE.min}
            maximumValue={WEATHER_RISK_RANGE.max}
            value={currentScenario.weatherRisk}
            onValueChange={value => {
              setCurrentScenario(prev => ({
                ...prev,
                weatherRisk: value
              }));
            }}
          />
          <Text style={styles.sliderValue}>{currentScenario.weatherRisk.toFixed(0)}%</Text>
        </View>
      </View>
    );
  };

  const renderROITimeline = () => {
    const metrics = calculateMetrics(currentScenario);
    const months = Array.from({ length: 60 }, (_, i) => i + 1);
    const cumulativeInvestment = months.map(month => {
      const monthlyInvestment = metrics.totalInvestment / currentScenario.timeline;
      return Math.min(monthlyInvestment * month, metrics.totalInvestment);
    });
    const cumulativeBenefit = months.map(month => {
      const monthlyBenefit = metrics.annualSavings / 12;
      return monthlyBenefit * month;
    });

    const data = {
      labels: months.map(m => (m % 12 === 0 ? `${m / 12}y` : '')),
      datasets: [
        {
          data: cumulativeInvestment,
          color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
          strokeWidth: 2
        },
        {
          data: cumulativeBenefit,
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          strokeWidth: 2
        }
      ]
    };

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ROI Timeline</Text>
        <LineChart
          data={data}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16
            }
          }}
          style={styles.chart}
        />
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#F44336' }]} />
            <Text>Investment</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
            <Text>Benefit</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderMetrics = () => {
    const metrics = calculateMetrics(currentScenario);

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Economic Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Investment</Text>
            <Text style={styles.metricValue}>${metrics.totalInvestment.toLocaleString()}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Annual Savings</Text>
            <Text style={styles.metricValue}>${metrics.annualSavings.toLocaleString()}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Breakeven</Text>
            <Text style={styles.metricValue}>{metrics.breakevenMonths} months</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>5-Year ROI</Text>
            <Text style={styles.metricValue}>{metrics.fiveYearROI.toFixed(1)}%</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Carbon Revenue</Text>
            <Text style={styles.metricValue}>${metrics.carbonRevenue.toLocaleString()}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Net Present Value</Text>
            <Text style={styles.metricValue}>${metrics.netPresentValue.toLocaleString()}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEducationalContent = () => {
    if (!showEducational) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Educational Resources</Text>
        <View style={styles.educationalContent}>
          <Text style={styles.subsectionTitle}>Case Studies</Text>
          <Text style={styles.contentText}>
            • Johnson Ranch: 35% cost reduction through rotational grazing{'\n'}
            • Smith Family Farm: 40% increase in stocking rate{'\n'}
            • Green Valley Ranch: $50,000 annual savings in feed costs
          </Text>

          <Text style={styles.subsectionTitle}>Funding Opportunities</Text>
          <Text style={styles.contentText}>
            • NRCS Conservation Stewardship Program{'\n'}
            • State Agricultural Enhancement Grants{'\n'}
            • Carbon Credit Programs
          </Text>

          <Text style={styles.subsectionTitle}>Success Metrics</Text>
          <Text style={styles.contentText}>
            • Soil organic matter increase{'\n'}
            • Water infiltration rates{'\n'}
            • Biodiversity indicators{'\n'}
            • Economic returns
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {renderCostInputs()}
      {renderSavingsInputs()}
      {renderProductivityInputs()}
      {renderScenarioControls()}
      {renderROITimeline()}
      {renderMetrics()}
      {renderEducationalContent()}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={saveScenario}
        >
          <Text style={styles.buttonText}>Save Scenario</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.reportButton]}
          onPress={generateReport}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Generate Report</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.educationButton]}
          onPress={() => setShowEducational(!showEducational)}
        >
          <Text style={styles.buttonText}>
            {showEducational ? 'Hide Resources' : 'Show Resources'}
          </Text>
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
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  inputLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666'
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
    fontSize: 14
  },
  slider: {
    flex: 1,
    marginHorizontal: 8
  },
  sliderValue: {
    width: 50,
    textAlign: 'right',
    fontSize: 14
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12
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
  educationalContent: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8
  },
  contentText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666'
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
    minWidth: 120,
    alignItems: 'center'
  },
  saveButton: {
    backgroundColor: '#4CAF50'
  },
  reportButton: {
    backgroundColor: '#2196F3'
  },
  educationButton: {
    backgroundColor: '#FF9800'
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  }
});

export default EconomicImpactCalculator; 