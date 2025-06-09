import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@react-navigation/native';
import { BarChart } from 'react-native-chart-kit';
import { formatCurrency } from '../../../utils/formatters';
import { Report } from '../../../store/types/financial';

interface EntityProfitabilityProps {
  report: Report;
}

interface EntityDetails {
  entities: Array<{
    id: string;
    name: string;
    revenue: number;
    costs: number;
    profit: number;
    roi: number;
  }>;
}

export const EntityProfitability: React.FC<EntityProfitabilityProps> = ({ report }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  const { summary, details } = report.results;
  const entityDetails = details as EntityDetails;
  const { entities } = entityDetails;

  const chartData = {
    labels: entities.map(e => e.name),
    datasets: [
      {
        data: entities.map(e => e.revenue),
        color: (opacity = 1) => colors.primary
      },
      {
        data: entities.map(e => e.costs),
        color: (opacity = 1) => colors.text
      }
    ],
    legend: [t('reports.entity.revenue'), t('reports.entity.costs')]
  };

  const chartConfig = {
    backgroundColor: colors.background,
    backgroundGradientFrom: colors.background,
    backgroundGradientTo: colors.background,
    decimalPlaces: 0,
    color: (opacity = 1) => colors.text,
    labelColor: (opacity = 1) => colors.text,
    style: {
      borderRadius: 16
    },
    barPercentage: 0.5
  };

  return (
    <View style={styles.container}>
      <View style={styles.metricsContainer}>
        <View style={styles.metric}>
          <Text style={[styles.metricLabel, { color: colors.text }]}>
            {t('reports.entity.totalRevenue')}
          </Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {formatCurrency(summary.totalIncome)}
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={[styles.metricLabel, { color: colors.text }]}>
            {t('reports.entity.totalCosts')}
          </Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {formatCurrency(summary.totalExpenses)}
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={[styles.metricLabel, { color: colors.text }]}>
            {t('reports.entity.totalProfit')}
          </Text>
          <Text
            style={[
              styles.metricValue,
              {
                color: summary.netProfit >= 0 ? '#3B7302' : '#BA1A1A'
              }
            ]}
          >
            {formatCurrency(summary.netProfit)}
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={[styles.metricLabel, { color: colors.text }]}>
            {t('reports.entity.averageROI')}
          </Text>
          <Text
            style={[
              styles.metricValue,
              {
                color: summary.netProfit >= 0 ? '#3B7302' : '#BA1A1A'
              }
            ]}
          >
            {((summary.netProfit / summary.totalExpenses) * 100).toFixed(1)}%
          </Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <BarChart
          data={chartData}
          width={screenWidth - 32}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={chartConfig}
          verticalLabelRotation={30}
          showValuesOnTopOfBars
        />
      </View>

      <View style={styles.breakdownContainer}>
        <Text style={[styles.breakdownTitle, { color: colors.text }]}>
          {t('reports.entity.breakdown')}
        </Text>
        {entities.map((entity) => (
          <View key={entity.id} style={styles.entityRow}>
            <Text style={[styles.entityName, { color: colors.text }]}>
              {entity.name}
            </Text>
            <View style={styles.entityMetrics}>
              <View style={styles.entityMetric}>
                <Text style={[styles.metricLabel, { color: colors.text }]}>
                  {t('reports.entity.revenue')}
                </Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {formatCurrency(entity.revenue)}
                </Text>
              </View>
              <View style={styles.entityMetric}>
                <Text style={[styles.metricLabel, { color: colors.text }]}>
                  {t('reports.entity.costs')}
                </Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {formatCurrency(entity.costs)}
                </Text>
              </View>
              <View style={styles.entityMetric}>
                <Text style={[styles.metricLabel, { color: colors.text }]}>
                  {t('reports.entity.profit')}
                </Text>
                <Text
                  style={[
                    styles.metricValue,
                    {
                      color: entity.profit >= 0 ? '#3B7302' : '#BA1A1A'
                    }
                  ]}
                >
                  {formatCurrency(entity.profit)}
                </Text>
              </View>
              <View style={styles.entityMetric}>
                <Text style={[styles.metricLabel, { color: colors.text }]}>
                  {t('reports.entity.roi')}
                </Text>
                <Text
                  style={[
                    styles.metricValue,
                    {
                      color: entity.roi >= 0 ? '#3B7302' : '#BA1A1A'
                    }
                  ]}
                >
                  {entity.roi.toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 24
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  metric: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  metricLabel: {
    fontSize: 14,
    marginBottom: 4
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600'
  },
  chartContainer: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8
  },
  breakdownContainer: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16
  },
  entityRow: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  entityName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8
  },
  entityMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  entityMetric: {
    flex: 1,
    minWidth: '45%'
  }
}); 