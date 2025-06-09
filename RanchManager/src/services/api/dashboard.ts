import { DashboardApiResponse, HealthAlert, Activity, DashboardMetrics } from '../../store/types/dashboard';
import firestore from '@react-native-firebase/firestore';
import { AlertSeverity } from '../../store/types/dashboard';

const HEALTH_ALERT_SEVERITY_ORDER: Record<AlertSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export const fetchDashboardData = async (): Promise<DashboardApiResponse> => {
  try {
    // Fetch metrics
    const metricsSnapshot = await firestore()
      .collection('metrics')
      .doc('dashboard')
      .get();

    const metrics: DashboardMetrics = {
      totalCattle: metricsSnapshot.data()?.totalCattle || 0,
      activeCattle: metricsSnapshot.data()?.activeCattle || 0,
      sickCattle: metricsSnapshot.data()?.sickCattle || 0,
      underObservation: metricsSnapshot.data()?.underObservation || 0,
      totalWeight: metricsSnapshot.data()?.totalWeight || 0,
      averageWeight: metricsSnapshot.data()?.averageWeight || 0,
      lastUpdated: metricsSnapshot.data()?.lastUpdated?.toDate() || new Date(),
    };

    // Fetch health alerts
    const alertsSnapshot = await firestore()
      .collection('healthAlerts')
      .where('resolved', '==', false)
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    const healthAlerts: HealthAlert[] = alertsSnapshot.docs.map(doc => ({
      id: doc.id,
      cattleId: doc.data().cattleId,
      cattleName: doc.data().cattleName,
      severity: doc.data().severity,
      description: doc.data().description,
      timestamp: doc.data().timestamp.toDate(),
      resolved: doc.data().resolved,
      resolvedAt: doc.data().resolvedAt?.toDate(),
    }));

    // Sort alerts by severity
    healthAlerts.sort((a, b) => 
      HEALTH_ALERT_SEVERITY_ORDER[a.severity] - HEALTH_ALERT_SEVERITY_ORDER[b.severity]
    );

    // Fetch recent activities
    const activitiesSnapshot = await firestore()
      .collection('activities')
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();

    const recentActivities: Activity[] = activitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      type: doc.data().type,
      description: doc.data().description,
      timestamp: doc.data().timestamp.toDate(),
      cattleId: doc.data().cattleId,
      cattleName: doc.data().cattleName,
      metadata: doc.data().metadata,
    }));

    return {
      metrics,
      healthAlerts,
      recentActivities,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw new Error('Failed to fetch dashboard data');
  }
};

export const updateHealthAlert = async (
  alertId: string,
  updates: Partial<HealthAlert>
): Promise<void> => {
  try {
    await firestore()
      .collection('healthAlerts')
      .doc(alertId)
      .update({
        ...updates,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
  } catch (error) {
    console.error('Error updating health alert:', error);
    throw new Error('Failed to update health alert');
  }
};

export const addActivity = async (activity: Omit<Activity, 'id'>): Promise<void> => {
  try {
    await firestore()
      .collection('activities')
      .add({
        ...activity,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });
  } catch (error) {
    console.error('Error adding activity:', error);
    throw new Error('Failed to add activity');
  }
}; 