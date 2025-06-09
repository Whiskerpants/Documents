import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@react-navigation/native';
import { BarChart } from 'react-native-chart-kit';
import { formatCurrency } from '../../../utils/formatters';
import { Report } from '../../../store/types/financial';

interface BudgetPerformanceProps {
  report: Report;
}

interface BudgetDetails {
  periods: Array<{
    period: string;
    budgeted: number;
    actual: number;
    variance: number;
  }>;
}

export const BudgetPerformance: React.FC<BudgetPerformanceProps> = ({ report }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  const { summary, details } = report.results;
  const budgetDetails = details as BudgetDetails;
  const { periods } = budgetDetails;

  const chartData = {
    labels: periods.map(p => p.period),
    datasets: [
      {
        data: periods.map(p => p.budgeted),
        color: (opacity = 1) => colors.primary
      },
      {
        data: periods.map(p => p.actual),
        color: (opacity = 1) => colors.text
      }
    ],
    legend: [t('reports.budget.budgeted'), t('reports.budget.actual')]
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
            {t('reports.budget.totalBudgeted')}
          </Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {formatCurrency(summary.totalExpenses)}
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={[styles.metricLabel, { color: colors.text }]}>
            {t('reports.budget.totalActual')}
          </Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {formatCurrency(summary.totalIncome)}
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={[styles.metricLabel, { color: colors.text }]}>
            {t('reports.budget.variance')}
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
            {t('reports.budget.variancePercentage')}
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
          {t('reports.budget.breakdown')}
        </Text>
        {periods.map((period) => (
          <View key={period.period} style={styles.periodRow}>
            <Text style={[styles.periodLabel, { color: colors.text }]}>
              {period.period}
            </Text>
            <View style={styles.periodValues}>
              <View style={styles.periodValue}>
                <Text style={[styles.valueLabel, { color: colors.text }]}>
                  {t('reports.budget.budgeted')}
                </Text>
                <Text style={[styles.valueAmount, { color: colors.text }]}>
                  {formatCurrency(period.budgeted)}
                </Text>
              </View>
              <View style={styles.periodValue}>
                <Text style={[styles.valueLabel, { color: colors.text }]}>
                  {t('reports.budget.actual')}
                </Text>
                <Text style={[styles.valueAmount, { color: colors.text }]}>
                  {formatCurrency(period.actual)}
                </Text>
              </View>
              <View style={styles.periodValue}>
                <Text style={[styles.valueLabel, { color: colors.text }]}>
                  {t('reports.budget.variance')}
                </Text>
                <Text
                  style={[
                    styles.valueAmount,
                    {
                      color: period.variance >= 0 ? '#3B7302' : '#BA1A1A'
                    }
                  ]}
                >
                  {formatCurrency(period.variance)}
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
  periodRow: {
    marginBottom: 16
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8
  },
  periodValues: {
    flexDirection: 'row',
    gap: 16
  },
  periodValue: {
    flex: 1
  },
  valueLabel: {
    fontSize: 12,
    marginBottom: 4
  },
  valueAmount: {
    fontSize: 14,
    fontWeight: '500'
  }
}); 