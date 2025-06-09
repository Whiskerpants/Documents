import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { formatCurrency } from '../../../utils/formatters';
import { Report } from '../../../store/types/financial';

interface IncomeStatementProps {
  report: Report;
}

export const IncomeStatement: React.FC<IncomeStatementProps> = ({ report }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  const { summary, details } = report.results;
  const { periods, income, expenses } = details;

  const chartData = {
    labels: periods,
    datasets: [
      {
        data: income,
        color: (opacity = 1) => `rgba(59, 115, 2, ${opacity})`, // Green for income
        strokeWidth: 2
      },
      {
        data: expenses,
        color: (opacity = 1) => `rgba(186, 26, 26, ${opacity})`, // Red for expenses
        strokeWidth: 2
      }
    ]
  };

  const chartConfig = {
    backgroundGradientFrom: colors.background,
    backgroundGradientTo: colors.background,
    decimalPlaces: 0,
    color: (opacity = 1) => colors.text,
    labelColor: (opacity = 1) => colors.text,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2'
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.metricsContainer}>
        <View style={styles.metric}>
          <Text style={[styles.metricLabel, { color: colors.text }]}>
            {t('reports.income.totalIncome')}
          </Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {formatCurrency(summary.totalIncome)}
          </Text>
        </View>

        <View style={styles.metric}>
          <Text style={[styles.metricLabel, { color: colors.text }]}>
            {t('reports.income.totalExpenses')}
          </Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {formatCurrency(summary.totalExpenses)}
          </Text>
        </View>

        <View style={styles.metric}>
          <Text style={[styles.metricLabel, { color: colors.text }]}>
            {t('reports.income.netIncome')}
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
            {t('reports.income.profitMargin')}
          </Text>
          <Text
            style={[
              styles.metricValue,
              {
                color: summary.netProfit >= 0 ? '#3B7302' : '#BA1A1A'
              }
            ]}
          >
            {((summary.netProfit / summary.totalIncome) * 100).toFixed(1)}%
          </Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          {t('reports.income.trends')}
        </Text>
        <LineChart
          data={chartData}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.breakdownContainer}>
        <Text style={[styles.breakdownTitle, { color: colors.text }]}>
          {t('reports.income.breakdown')}
        </Text>
        {periods.map((period, index) => (
          <View key={period} style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.text }]}>
              {period}
            </Text>
            <View style={styles.breakdownValues}>
              <Text style={[styles.breakdownValue, { color: '#3B7302' }]}>
                {formatCurrency(income[index])}
              </Text>
              <Text style={[styles.breakdownValue, { color: '#BA1A1A' }]}>
                {formatCurrency(expenses[index])}
              </Text>
              <Text
                style={[
                  styles.breakdownValue,
                  {
                    color:
                      income[index] - expenses[index] >= 0
                        ? '#3B7302'
                        : '#BA1A1A'
                  }
                ]}
              >
                {formatCurrency(income[index] - expenses[index])}
              </Text>
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
    minWidth: 150,
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8
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
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16
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
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  breakdownLabel: {
    fontSize: 14,
    flex: 1
  },
  breakdownValues: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right'
  }
}); 