import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

// TODO: Import these types from your store
interface DashboardMetrics {
  totalCattle: number;
  activeCattle: number;
  sickCattle: number;
  underObservation: number;
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: Date;
  }>;
  healthAlerts: Array<{
    id: string;
    cattleId: string;
    cattleName: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    timestamp: Date;
  }>;
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCattle: 0,
    activeCattle: 0,
    sickCattle: 0,
    underObservation: 0,
    recentActivities: [],
    healthAlerts: [],
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await dispatch(fetchDashboardMetrics());
      // setMetrics(response.payload);
      
      // Temporary mock data
      setMetrics({
        totalCattle: 150,
        activeCattle: 142,
        sickCattle: 3,
        underObservation: 5,
        recentActivities: [
          {
            id: '1',
            type: 'weight',
            description: 'Weight recorded for Angus #123',
            timestamp: new Date(),
          },
          {
            id: '2',
            type: 'health',
            description: 'Health check completed for Hereford #456',
            timestamp: new Date(),
          },
        ],
        healthAlerts: [
          {
            id: '1',
            cattleId: '123',
            cattleName: 'Angus #123',
            severity: 'high',
            description: 'Temperature above normal',
            timestamp: new Date(),
          },
        ],
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const renderMetricCard = (title: string, value: number, icon: string, color: string) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <Icon name={icon} size={24} color={color} style={styles.metricIcon} />
      <View style={styles.metricContent}>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => navigation.navigate('AddCattle')}
      >
        <Icon name="add-circle" size={24} color="#3B7302" />
        <Text style={styles.actionText}>{t('dashboard.actions.addCattle')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => navigation.navigate('HealthCheck')}
      >
        <Icon name="medical-services" size={24} color="#3B7302" />
        <Text style={styles.actionText}>{t('dashboard.actions.healthCheck')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => navigation.navigate('WeightRecord')}
      >
        <Icon name="monitor-weight" size={24} color="#3B7302" />
        <Text style={styles.actionText}>{t('dashboard.actions.recordWeight')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHealthAlerts = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('dashboard.healthAlerts')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('HealthAlerts')}>
          <Text style={styles.seeAllText}>{t('dashboard.seeAll')}</Text>
        </TouchableOpacity>
      </View>
      {metrics.healthAlerts.map(alert => (
        <View key={alert.id} style={[styles.alertCard, styles[`alert${alert.severity}`]]}>
          <Icon
            name="warning"
            size={24}
            color={alert.severity === 'high' ? '#D32F2F' : '#FFA000'}
          />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>{alert.cattleName}</Text>
            <Text style={styles.alertDescription}>{alert.description}</Text>
            <Text style={styles.alertTime}>
              {new Date(alert.timestamp).toLocaleString()}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderRecentActivities = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('dashboard.recentActivities')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Activities')}>
          <Text style={styles.seeAllText}>{t('dashboard.seeAll')}</Text>
        </TouchableOpacity>
      </View>
      {metrics.recentActivities.map(activity => (
        <View key={activity.id} style={styles.activityCard}>
          <Icon
            name={activity.type === 'weight' ? 'monitor-weight' : 'medical-services'}
            size={24}
            color="#3B7302"
          />
          <View style={styles.activityContent}>
            <Text style={styles.activityDescription}>{activity.description}</Text>
            <Text style={styles.activityTime}>
              {new Date(activity.timestamp).toLocaleString()}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B7302" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t('dashboard.title')}</Text>
        <Text style={styles.subtitle}>{t('dashboard.subtitle')}</Text>
      </View>

      <View style={styles.metricsContainer}>
        {renderMetricCard(t('dashboard.metrics.totalCattle'), metrics.totalCattle, 'pets', '#3B7302')}
        {renderMetricCard(t('dashboard.metrics.activeCattle'), metrics.activeCattle, 'check-circle', '#4CAF50')}
        {renderMetricCard(t('dashboard.metrics.sickCattle'), metrics.sickCattle, 'medical-services', '#F44336')}
        {renderMetricCard(t('dashboard.metrics.underObservation'), metrics.underObservation, 'visibility', '#FFA000')}
      </View>

      {renderQuickActions()}
      {renderHealthAlerts()}
      {renderRecentActivities()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  metricsContainer: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricIcon: {
    marginRight: 12,
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  metricTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
  },
  actionText: {
    marginTop: 8,
    color: '#3B7302',
    fontSize: 14,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    color: '#3B7302',
    fontSize: 14,
  },
  alertCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#FFF3E0',
  },
  alerthigh: {
    backgroundColor: '#FFEBEE',
  },
  alertmedium: {
    backgroundColor: '#FFF3E0',
  },
  alertlow: {
    backgroundColor: '#E8F5E9',
  },
  alertContent: {
    marginLeft: 12,
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  alertDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  activityCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  activityContent: {
    marginLeft: 12,
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    color: '#333',
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});

export default Dashboard; 