import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import { formatCurrency } from '../../../utils/formatters';
import { Report } from '../../../store/types/financial';

interface ExpenseBreakdownProps {
  report: Report;
}

export const ExpenseBreakdown: React.FC<ExpenseBreakdownProps> = ({ report }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  const { summary, details } = report.results;
  const { categories } = details;

  const chartData = categories.map((category, index) => ({
    name: category.name,
    amount: category.amount,
    color: category.color,
    legendFontColor: colors.text,
    legendFontSize: 12
  }));

  const chartConfig = {
    color: (opacity = 1) => colors.text,
    labelColor: (opacity = 1) => colors.text,
    style: {
      borderRadius: 16
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <PieChart
          data={chartData}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>

      <View style={styles.summaryContainer}>
        <Text style={[styles.summaryLabel, { color: colors.text }]}>
          {t('reports.expense.totalExpenses')}
        </Text>
        <Text style={[styles.summaryValue, { color: colors.text }]}>
          {formatCurrency(summary.totalExpenses)}
        </Text>
      </View>

      <View style={styles.breakdownContainer}>
        <Text style={[styles.breakdownTitle, { color: colors.text }]}>
          {t('reports.expense.breakdown')}
        </Text>
        {categories.map((category) => (
          <View key={category.name} style={styles.categoryRow}>
            <View style={styles.categoryInfo}>
              <View
                style={[
                  styles.categoryColor,
                  { backgroundColor: category.color }
                ]}
              />
              <Text style={[styles.categoryName, { color: colors.text }]}>
                {category.name}
              </Text>
            </View>
            <View style={styles.categoryAmounts}>
              <Text style={[styles.categoryAmount, { color: colors.text }]}>
                {formatCurrency(category.amount)}
              </Text>
              <Text style={[styles.categoryPercentage, { color: colors.text }]}>
                {((category.amount / summary.totalExpenses) * 100).toFixed(1)}%
              </Text>
            </View>
          </View>
        ))}
      </View>

      {details.trends && (
        <View style={styles.trendsContainer}>
          <Text style={[styles.trendsTitle, { color: colors.text }]}>
            {t('reports.expense.trends')}
          </Text>
          {details.trends.map((trend) => (
            <View key={trend.category} style={styles.trendRow}>
              <Text style={[styles.trendCategory, { color: colors.text }]}>
                {trend.category}
              </Text>
              <View style={styles.trendInfo}>
                <Text
                  style={[
                    styles.trendChange,
                    {
                      color: trend.change >= 0 ? '#3B7302' : '#BA1A1A'
                    }
                  ]}
                >
                  {trend.change >= 0 ? '+' : ''}
                  {trend.change.toFixed(1)}%
                </Text>
                <Text style={[styles.trendPeriod, { color: colors.text }]}>
                  {trend.period}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 24
  },
  chartContainer: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8
  },
  summaryContainer: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  summaryLabel: {
    fontSize: 16,
    marginBottom: 4
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '600'
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
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8
  },
  categoryName: {
    fontSize: 14
  },
  categoryAmounts: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8
  },
  categoryPercentage: {
    fontSize: 14,
    opacity: 0.7
  },
  trendsContainer: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8
  },
  trendsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  trendCategory: {
    fontSize: 14,
    flex: 1
  },
  trendInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  trendChange: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8
  },
  trendPeriod: {
    fontSize: 14,
    opacity: 0.7
  }
}); 