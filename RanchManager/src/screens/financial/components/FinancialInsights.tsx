import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TextStyle } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../../store/store';
import { InsightsService } from '../../../services/insightsService';
import { Card, Text, Button, Icon } from '../../../screens/common';
import { useTheme } from '../../../theme/ThemeContext';

export const FinancialInsights: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { transactions, budgets } = useSelector((state: RootState) => state.financial);
  const { items: cattle } = useSelector((state: RootState) => state.cattle);

  useEffect(() => {
    const loadInsights = async () => {
      setLoading(true);
      try {
        const insightsService = InsightsService.getInstance();
        
        const trends = insightsService.analyzeTrends(transactions.items);
        const anomalies = insightsService.detectAnomalies(transactions.items);
        const cashFlowPredictions = insightsService.predictCashFlow(
          transactions.items,
          budgets.items
        );
        const costReductions = insightsService.generateCostReductions(
          transactions.items,
          budgets.items
        );
        const cattleSales = insightsService.suggestCattleSales(
          cattle.map(c => c.financialSummary),
          [] // TODO: Add market trends data
        );

        setInsights({
          trends,
          anomalies,
          cashFlowPredictions,
          costReductions,
          cattleSales,
        });
      } catch (error) {
        console.error('Error loading insights:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
  }, [transactions.items, budgets.items, cattle]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!insights) {
    return (
      <View style={styles.container}>
        <Text>{t('common.error')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Trends Section */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>{t('financial.insights.trends')}</Text>
        {insights.trends.map((trend: any, index: number) => (
          <View key={index} style={styles.trendItem}>
            <Text style={styles.category}>{trend.category}</Text>
            <View style={styles.trendInfo}>
              <Icon
                name={trend.trend === 'increasing' ? 'trending-up' : 'trending-down'}
                size={20}
                color={trend.trend === 'increasing' ? colors.primary : colors.notification}
              />
              <Text style={{
                ...styles.percentage,
                color: trend.trend === 'increasing' ? colors.primary : colors.notification
              }}>
                {trend.percentageChange.toFixed(1)}%
              </Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Anomalies Section */}
      {insights.anomalies.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('financial.insights.anomalies')}</Text>
          {insights.anomalies.map((anomaly: any, index: number) => (
            <View key={index} style={styles.anomalyItem}>
              <Icon
                name="alert-circle"
                size={20}
                color={colors.notification}
              />
              <View style={styles.anomalyInfo}>
                <Text style={styles.anomalyType}>
                  {anomaly.type === 'spending' ? t('financial.insights.unusualSpending') : t('financial.insights.unusualIncome')}
                </Text>
                <Text style={styles.anomalyCategory}>{anomaly.category}</Text>
                <Text style={styles.anomalyAmount}>
                  {anomaly.amount.toLocaleString(undefined, {
                    style: 'currency',
                    currency: 'USD',
                  })}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* Cash Flow Predictions */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>{t('financial.insights.cashFlow')}</Text>
        {insights.cashFlowPredictions.map((prediction: any, index: number) => (
          <View key={index} style={styles.predictionItem}>
            <Text style={styles.period}>{prediction.period}</Text>
            <View style={styles.predictionDetails}>
              <View style={styles.predictionRow}>
                <Text>{t('financial.insights.income')}</Text>
                <Text style={styles.amount}>
                  {prediction.predictedIncome.toLocaleString(undefined, {
                    style: 'currency',
                    currency: 'USD',
                  })}
                </Text>
              </View>
              <View style={styles.predictionRow}>
                <Text>{t('financial.insights.expenses')}</Text>
                <Text style={styles.amount}>
                  {prediction.predictedExpenses.toLocaleString(undefined, {
                    style: 'currency',
                    currency: 'USD',
                  })}
                </Text>
              </View>
              <View style={styles.predictionRow}>
                <Text>{t('financial.insights.netCashFlow')}</Text>
                <Text style={{
                  ...styles.amount,
                  color: prediction.predictedIncome - prediction.predictedExpenses >= 0
                    ? colors.primary
                    : colors.notification
                }}>
                  {(prediction.predictedIncome - prediction.predictedExpenses).toLocaleString(undefined, {
                    style: 'currency',
                    currency: 'USD',
                  })}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </Card>

      {/* Cost Reduction Recommendations */}
      {insights.costReductions.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('financial.insights.costReductions')}</Text>
          {insights.costReductions.map((reduction: any, index: number) => (
            <View key={index} style={styles.recommendationItem}>
              <Text style={styles.category}>{reduction.category}</Text>
              <Text style={styles.potentialSavings}>
                {t('financial.insights.potentialSavings', {
                  amount: reduction.potentialSavings.toLocaleString(undefined, {
                    style: 'currency',
                    currency: 'USD',
                  })
                })}
              </Text>
              <View style={styles.recommendations}>
                {reduction.recommendations.map((rec: string, recIndex: number) => (
                  <View key={recIndex} style={styles.recommendation}>
                    <Icon name="check-circle" size={16} color={colors.primary} />
                    <Text style={styles.recommendationText}>{rec}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.difficulty}>
                <Text style={styles.difficultyLabel}>
                  {t('financial.insights.implementationDifficulty')}:
                </Text>
                <Text style={{
                  ...styles.difficultyValue,
                  color: reduction.implementationDifficulty === 'low'
                    ? colors.primary
                    : reduction.implementationDifficulty === 'medium'
                      ? colors.notification
                      : colors.notification
                }}>
                  {t(`financial.insights.difficulty.${reduction.implementationDifficulty}`)}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* Cattle Sale Recommendations */}
      {insights.cattleSales.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('financial.insights.cattleSales')}</Text>
          {insights.cattleSales.map((sale: any, index: number) => (
            <View key={index} style={styles.saleItem}>
              <Text style={styles.cattleId}>Cattle ID: {sale.cattleId}</Text>
              <View style={styles.saleDetails}>
                <View style={styles.saleRow}>
                  <Text>{t('financial.insights.recommendedDate')}</Text>
                  <Text style={styles.date}>
                    {new Date(sale.recommendedSaleDate).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.saleRow}>
                  <Text>{t('financial.insights.predictedPrice')}</Text>
                  <Text style={styles.amount}>
                    {sale.predictedPrice.toLocaleString(undefined, {
                      style: 'currency',
                      currency: 'USD',
                    })}
                  </Text>
                </View>
                <View style={styles.factors}>
                  <Text style={styles.factorsTitle}>{t('financial.insights.factors')}</Text>
                  <View style={styles.factor}>
                    <Icon
                      name={sale.factors.marketTrend === 'up' ? 'trending-up' : 'trending-down'}
                      size={16}
                      color={sale.factors.marketTrend === 'up' ? colors.primary : colors.notification}
                    />
                    <Text style={styles.factorText}>
                      {t(`financial.insights.marketTrend.${sale.factors.marketTrend}`)}
                    </Text>
                  </View>
                  <View style={styles.factor}>
                    <Icon name="weight" size={16} color={colors.primary} />
                    <Text style={styles.factorText}>
                      {t('financial.insights.weightGain', { gain: sale.factors.weightGain })}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    fontSize: 16,
    fontWeight: '500',
  },
  percentage: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  anomalyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  anomalyInfo: {
    marginLeft: 12,
    flex: 1,
  },
  anomalyType: {
    fontSize: 16,
    fontWeight: '500',
  },
  anomalyCategory: {
    fontSize: 14,
    opacity: 0.7,
  },
  anomalyAmount: {
    fontSize: 16,
    fontWeight: '500',
  },
  predictionItem: {
    marginBottom: 16,
  },
  period: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  predictionDetails: {
    marginLeft: 16,
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  amount: {
    fontWeight: '500',
  },
  recommendationItem: {
    marginBottom: 16,
  },
  potentialSavings: {
    fontSize: 16,
    fontWeight: '500',
    marginVertical: 8,
  },
  recommendations: {
    marginVertical: 8,
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  recommendationText: {
    marginLeft: 8,
  },
  difficulty: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  difficultyLabel: {
    marginRight: 8,
  },
  difficultyValue: {
    fontWeight: '500',
  },
  saleItem: {
    marginBottom: 16,
  },
  cattleId: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  saleDetails: {
    marginLeft: 16,
  },
  saleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  date: {
    fontWeight: '500',
  },
  factors: {
    marginTop: 8,
  },
  factorsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  factor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  factorText: {
    marginLeft: 8,
  },
}); 