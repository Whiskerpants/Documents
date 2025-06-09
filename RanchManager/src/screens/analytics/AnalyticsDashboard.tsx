import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icon';
import { InsightCard, InsightType } from '../../components/analytics/InsightCard';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatUtils';

interface KPIData {
  label: string;
  value: number;
  change: number;
  target: number;
}

interface TrendData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
  }[];
}

interface BenchmarkData {
  metric: string;
  yourValue: number;
  industryAverage: number;
  percentile: number;
}

export const AnalyticsDashboard: React.FC = () => {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [kpis, setKpis] = useState<KPIData[]>([]);
  const [trends, setTrends] = useState<Record<string, TrendData>>({});
  const [benchmarks, setBenchmarks] = useState<BenchmarkData[]>([]);
  const [insights, setInsights] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    try {
      // TODO: Replace with actual API calls
      // Simulated data for demonstration
      setKpis([
        {
          label: 'Revenue',
          value: 125000,
          change: 12.5,
          target: 150000,
        },
        {
          label: 'Operating Costs',
          value: 75000,
          change: -5.2,
          target: 70000,
        },
        {
          label: 'Profit Margin',
          value: 40,
          change: 2.1,
          target: 45,
        },
        {
          label: 'Cattle Health Score',
          value: 92,
          change: 1.5,
          target: 95,
        },
      ]);

      setTrends({
        revenue: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            {
              data: [100000, 110000, 105000, 115000, 120000, 125000],
              color: (opacity = 1) => theme.colors.primary,
            },
          ],
        },
        health: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            {
              data: [88, 89, 90, 91, 91, 92],
              color: (opacity = 1) => '#4CAF50',
            },
          ],
        },
      });

      setBenchmarks([
        {
          metric: 'Profit Margin',
          yourValue: 40,
          industryAverage: 35,
          percentile: 75,
        },
        {
          metric: 'Cattle Health Score',
          yourValue: 92,
          industryAverage: 88,
          percentile: 85,
        },
        {
          metric: 'Operating Efficiency',
          yourValue: 82,
          industryAverage: 78,
          percentile: 70,
        },
      ]);

      setInsights([
        {
          title: 'Revenue Growth Opportunity',
          description:
            'Based on current trends, implementing automated feeding systems could increase efficiency by 15% and reduce labor costs.',
          type: 'opportunity' as InsightType,
          impact: 'Potential annual savings of $45,000',
          metrics: [
            {
              label: 'Current Efficiency',
              value: '82%',
              change: 0,
            },
            {
              label: 'Potential Efficiency',
              value: '94%',
              change: 12,
            },
          ],
          action: {
            label: 'View Automation Options',
            onPress: () => {},
          },
        },
        {
          title: 'Health Trend Alert',
          description:
            'Recent health scores show a slight decline in the northern pasture. Consider scheduling a veterinary inspection.',
          type: 'warning' as InsightType,
          impact: 'Prevent potential health issues affecting 50 cattle',
          metrics: [
            {
              label: 'Health Score',
              value: '88%',
              change: -2,
            },
          ],
          action: {
            label: 'Schedule Inspection',
            onPress: () => {},
          },
        },
      ]);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderKPICard = (kpi: KPIData) => (
    <Card key={kpi.label} style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{kpi.label}</Text>
      <Text style={styles.kpiValue}>
        {kpi.label.includes('Margin')
          ? formatPercentage(kpi.value)
          : formatCurrency(kpi.value)}
      </Text>
      <View style={styles.kpiChangeContainer}>
        <Icon
          name={kpi.change >= 0 ? 'trending-up' : 'trending-down'}
          size={16}
          color={kpi.change >= 0 ? '#4CAF50' : theme.colors.notification}
        />
        <Text
          style={[
            styles.kpiChange,
            {
              color: kpi.change >= 0 ? '#4CAF50' : theme.colors.notification,
            },
          ]}
        >
          {kpi.change >= 0 ? '+' : ''}
          {formatPercentage(kpi.change)}
        </Text>
      </View>
      <View style={styles.kpiProgress}>
        <View
          style={[
            styles.kpiProgressBar,
            {
              width: `${(kpi.value / kpi.target) * 100}%`,
              backgroundColor: theme.colors.primary,
            },
          ]}
        />
      </View>
      <Text style={styles.kpiTarget}>
        Target: {formatCurrency(kpi.target)}
      </Text>
    </Card>
  );

  const renderTrendChart = (title: string, data: TrendData) => (
    <Card style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      <LineChart
        data={data}
        width={Dimensions.get('window').width - 48}
        height={220}
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => theme.colors.primary,
          labelColor: (opacity = 1) => '#333',
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: theme.colors.primary,
          },
        }}
        bezier
        style={styles.chart}
      />
    </Card>
  );

  const renderBenchmarkCard = (benchmark: BenchmarkData) => (
    <Card key={benchmark.metric} style={styles.benchmarkCard}>
      <Text style={styles.benchmarkMetric}>{benchmark.metric}</Text>
      <View style={styles.benchmarkValues}>
        <View style={styles.benchmarkValue}>
          <Text style={styles.benchmarkLabel}>Your Value</Text>
          <Text style={styles.benchmarkNumber}>
            {formatNumber(benchmark.yourValue)}
          </Text>
        </View>
        <View style={styles.benchmarkValue}>
          <Text style={styles.benchmarkLabel}>Industry Average</Text>
          <Text style={styles.benchmarkNumber}>
            {formatNumber(benchmark.industryAverage)}
          </Text>
        </View>
        <View style={styles.benchmarkValue}>
          <Text style={styles.benchmarkLabel}>Percentile</Text>
          <Text style={styles.benchmarkNumber}>
            {formatPercentage(benchmark.percentile)}
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <View style={styles.timeRangeContainer}>
          <Button
            title="Week"
            variant={timeRange === 'week' ? 'primary' : 'secondary'}
            onPress={() => setTimeRange('week')}
            style={styles.timeRangeButton}
          />
          <Button
            title="Month"
            variant={timeRange === 'month' ? 'primary' : 'secondary'}
            onPress={() => setTimeRange('month')}
            style={styles.timeRangeButton}
          />
          <Button
            title="Year"
            variant={timeRange === 'year' ? 'primary' : 'secondary'}
            onPress={() => setTimeRange('year')}
            style={styles.timeRangeButton}
          />
        </View>
      </View>

      <View style={styles.kpiContainer}>
        {kpis.map(renderKPICard)}
      </View>

      <View style={styles.trendsContainer}>
        {Object.entries(trends).map(([key, data]) =>
          renderTrendChart(key.charAt(0).toUpperCase() + key.slice(1), data)
        )}
      </View>

      <View style={styles.benchmarksContainer}>
        <Text style={styles.sectionTitle}>Industry Benchmarks</Text>
        {benchmarks.map(renderBenchmarkCard)}
      </View>

      <View style={styles.insightsContainer}>
        <Text style={styles.sectionTitle}>AI-Generated Insights</Text>
        {insights.map((insight, index) => (
          <InsightCard key={index} {...insight} />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeRangeButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  kpiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    margin: 8,
    padding: 16,
  },
  kpiLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  kpiChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiChange: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: 'bold',
  },
  kpiProgress: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 8,
  },
  kpiProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  kpiTarget: {
    fontSize: 12,
    color: '#666',
  },
  trendsContainer: {
    padding: 16,
  },
  chartCard: {
    marginBottom: 16,
    padding: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  benchmarksContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  benchmarkCard: {
    marginBottom: 16,
    padding: 16,
  },
  benchmarkMetric: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  benchmarkValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  benchmarkValue: {
    flex: 1,
    alignItems: 'center',
  },
  benchmarkLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  benchmarkNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  insightsContainer: {
    padding: 16,
  },
}); 