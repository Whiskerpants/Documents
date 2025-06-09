import { Transaction, Budget, FinancialSummary, TransactionType, TransactionCategory } from '../store/types/financial';
import { CattleFinancialSummary } from '../store/types/cattle';

interface TrendAnalysis {
  category: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  percentageChange: number;
  period: string;
}

interface AnomalyDetection {
  type: 'spending' | 'income';
  category: string;
  amount: number;
  expectedRange: [number, number];
  deviation: number;
  date: Date;
}

interface CashFlowPrediction {
  period: string;
  predictedIncome: number;
  predictedExpenses: number;
  confidence: number;
  factors: string[];
}

interface CostReductionRecommendation {
  category: string;
  currentSpending: number;
  potentialSavings: number;
  recommendations: string[];
  implementationDifficulty: 'low' | 'medium' | 'high';
}

interface CattleSaleRecommendation {
  cattleId: string;
  recommendedSaleDate: Date;
  predictedPrice: number;
  confidence: number;
  factors: {
    marketTrend: 'up' | 'down' | 'stable';
    weightGain: number;
    maintenanceCost: number;
    marketDemand: number;
  };
}

export class InsightsService {
  private static instance: InsightsService;
  private readonly ANOMALY_THRESHOLD = 2; // Standard deviations
  private readonly TREND_PERIODS = ['monthly', 'quarterly', 'yearly'];
  private readonly PREDICTION_HORIZON = 3; // Months

  private constructor() {}

  static getInstance(): InsightsService {
    if (!InsightsService.instance) {
      InsightsService.instance = new InsightsService();
    }
    return InsightsService.instance;
  }

  // Analyze spending patterns and identify trends
  analyzeTrends(transactions: Transaction[]): TrendAnalysis[] {
    const trends: TrendAnalysis[] = [];
    const categories = new Set(transactions.map(t => t.category));

    categories.forEach(category => {
      const categoryTransactions = transactions.filter(t => t.category === category);
      const monthlyTotals = this.groupByMonth(categoryTransactions);

      const trend = this.calculateTrend(monthlyTotals);
      const percentageChange = this.calculatePercentageChange(monthlyTotals);

      trends.push({
        category,
        trend,
        percentageChange,
        period: 'monthly',
      });
    });

    return trends;
  }

  // Detect unusual spending or income patterns
  detectAnomalies(transactions: Transaction[]): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];
    const categories = new Set(transactions.map(t => t.category));

    categories.forEach(category => {
      const categoryTransactions = transactions.filter(t => t.category === category);
      const amounts = categoryTransactions.map(t => t.amount);
      
      const mean = this.calculateMean(amounts);
      const stdDev = this.calculateStandardDeviation(amounts, mean);
      
      categoryTransactions.forEach(transaction => {
        const zScore = Math.abs((transaction.amount - mean) / stdDev);
        
        if (zScore > this.ANOMALY_THRESHOLD) {
          anomalies.push({
            type: transaction.type,
            category: transaction.category,
            amount: transaction.amount,
            expectedRange: [mean - stdDev, mean + stdDev],
            deviation: zScore,
            date: transaction.date,
          });
        }
      });
    });

    return anomalies;
  }

  // Predict future cash flow based on historical data
  predictCashFlow(
    transactions: Transaction[],
    budgets: Budget[],
    currentDate: Date = new Date()
  ): CashFlowPrediction[] {
    const predictions: CashFlowPrediction[] = [];
    const monthlyData = this.groupByMonth(transactions);

    for (let i = 1; i <= this.PREDICTION_HORIZON; i++) {
      const predictionDate = new Date(currentDate);
      predictionDate.setMonth(predictionDate.getMonth() + i);

      const incomePrediction = this.predictIncome(monthlyData, predictionDate);
      const expensePrediction = this.predictExpenses(monthlyData, budgets, predictionDate);

      predictions.push({
        period: predictionDate.toISOString().slice(0, 7), // YYYY-MM
        predictedIncome: incomePrediction.value,
        predictedExpenses: expensePrediction.value,
        confidence: Math.min(incomePrediction.confidence, expensePrediction.confidence),
        factors: [...incomePrediction.factors, ...expensePrediction.factors],
      });
    }

    return predictions;
  }

  // Generate cost reduction recommendations
  generateCostReductions(
    transactions: Transaction[],
    budgets: Budget[]
  ): CostReductionRecommendation[] {
    const recommendations: CostReductionRecommendation[] = [];
    const expenseCategories = new Set(
      transactions
        .filter(t => t.type === TransactionType.Expense)
        .map(t => t.category)
    );

    expenseCategories.forEach(category => {
      const categoryTransactions = transactions.filter(
        t => t.type === TransactionType.Expense && t.category === category
      );
      const currentSpending = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      const potentialSavings = this.analyzeCostReductionPotential(
        category,
        categoryTransactions,
        budgets
      );

      if (potentialSavings > 0) {
        recommendations.push({
          category,
          currentSpending,
          potentialSavings,
          recommendations: this.generateRecommendations(category, categoryTransactions),
          implementationDifficulty: this.assessImplementationDifficulty(category),
        });
      }
    });

    return recommendations;
  }

  // Suggest optimal timing for cattle sales
  suggestCattleSales(
    cattleSummaries: CattleFinancialSummary[],
    marketTrends: { date: Date; price: number }[],
    currentDate: Date = new Date()
  ): CattleSaleRecommendation[] {
    const recommendations: CattleSaleRecommendation[] = [];

    cattleSummaries.forEach(cattle => {
      const marketAnalysis = this.analyzeMarketTrends(marketTrends, currentDate);
      const weightGain = this.calculateWeightGain(cattle);
      const maintenanceCost = this.calculateMaintenanceCost(cattle);
      const marketDemand = this.assessMarketDemand(marketTrends);

      const optimalSaleDate = this.calculateOptimalSaleDate(
        cattle,
        marketAnalysis,
        weightGain,
        maintenanceCost,
        marketDemand
      );

      if (optimalSaleDate) {
        recommendations.push({
          cattleId: cattle.cattleId,
          recommendedSaleDate: optimalSaleDate,
          predictedPrice: this.predictSalePrice(cattle, marketAnalysis),
          confidence: this.calculateConfidence(marketAnalysis, weightGain, maintenanceCost),
          factors: {
            marketTrend: marketAnalysis.trend,
            weightGain,
            maintenanceCost,
            marketDemand,
          },
        });
      }
    });

    return recommendations;
  }

  // Private helper methods
  private groupByMonth(transactions: Transaction[]): Map<string, number> {
    const monthlyTotals = new Map<string, number>();
    
    transactions.forEach(transaction => {
      const monthKey = transaction.date.toISOString().slice(0, 7); // YYYY-MM
      const currentTotal = monthlyTotals.get(monthKey) || 0;
      monthlyTotals.set(monthKey, currentTotal + transaction.amount);
    });

    return monthlyTotals;
  }

  private calculateTrend(monthlyTotals: Map<string, number>): 'increasing' | 'decreasing' | 'stable' {
    const values = Array.from(monthlyTotals.values());
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = this.calculateMean(firstHalf);
    const secondAvg = this.calculateMean(secondHalf);
    
    const difference = secondAvg - firstAvg;
    const threshold = firstAvg * 0.1; // 10% threshold

    if (difference > threshold) return 'increasing';
    if (difference < -threshold) return 'decreasing';
    return 'stable';
  }

  private calculatePercentageChange(monthlyTotals: Map<string, number>): number {
    const values = Array.from(monthlyTotals.values());
    if (values.length < 2) return 0;

    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    
    return ((lastValue - firstValue) / firstValue) * 100;
  }

  private calculateMean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateStandardDeviation(values: number[], mean: number): number {
    const squareDiffs = values.map(value => {
      const diff = value - mean;
      return diff * diff;
    });
    
    const avgSquareDiff = this.calculateMean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }

  private predictIncome(
    monthlyData: Map<string, number>,
    targetDate: Date
  ): { value: number; confidence: number; factors: string[] } {
    // Implement time series analysis for income prediction
    // This is a simplified version - in production, use a proper forecasting model
    const values = Array.from(monthlyData.values());
    const trend = this.calculateTrend(monthlyData);
    
    const lastValue = values[values.length - 1];
    const growthRate = this.calculatePercentageChange(monthlyData) / 100;
    
    return {
      value: lastValue * (1 + growthRate),
      confidence: 0.7,
      factors: [`Trend: ${trend}`, `Growth rate: ${growthRate * 100}%`],
    };
  }

  private predictExpenses(
    monthlyData: Map<string, number>,
    budgets: Budget[],
    targetDate: Date
  ): { value: number; confidence: number; factors: string[] } {
    // Implement expense prediction based on historical data and budgets
    const values = Array.from(monthlyData.values());
    const trend = this.calculateTrend(monthlyData);
    
    const lastValue = values[values.length - 1];
    const growthRate = this.calculatePercentageChange(monthlyData) / 100;
    
    return {
      value: lastValue * (1 + growthRate),
      confidence: 0.8,
      factors: [`Trend: ${trend}`, `Growth rate: ${growthRate * 100}%`],
    };
  }

  private analyzeCostReductionPotential(
    category: string,
    transactions: Transaction[],
    budgets: Budget[]
  ): number {
    // Implement cost reduction analysis
    // This is a simplified version - in production, use more sophisticated analysis
    const totalSpending = transactions.reduce((sum, t) => sum + t.amount, 0);
    const budget = budgets.find(b => b.categoryAllocations[category]);
    
    if (!budget) return 0;
    
    const allocated = budget.categoryAllocations[category];
    return Math.max(0, totalSpending - allocated);
  }

  private generateRecommendations(
    category: string,
    transactions: Transaction[]
  ): string[] {
    // Generate specific recommendations based on category and transaction patterns
    const recommendations: string[] = [];
    
    switch (category) {
      case TransactionCategory.Feed:
        recommendations.push(
          'Consider bulk purchasing for better rates',
          'Review feed supplier contracts',
          'Optimize feed storage to reduce waste'
        );
        break;
      case TransactionCategory.Veterinary:
        recommendations.push(
          'Schedule regular preventive care',
          'Compare veterinary service providers',
          'Consider group purchasing for medications'
        );
        break;
      // Add more categories as needed
    }
    
    return recommendations;
  }

  private assessImplementationDifficulty(
    category: string
  ): 'low' | 'medium' | 'high' {
    // Assess the difficulty of implementing cost reductions
    const difficultyMap: Record<string, 'low' | 'medium' | 'high'> = {
      [TransactionCategory.Feed]: 'medium',
      [TransactionCategory.Veterinary]: 'high',
      [TransactionCategory.Equipment]: 'high',
      [TransactionCategory.Labor]: 'high',
      [TransactionCategory.Facilities]: 'high',
      [TransactionCategory.Transportation]: 'medium',
      [TransactionCategory.Marketing]: 'low',
      [TransactionCategory.Insurance]: 'medium',
      [TransactionCategory.Taxes]: 'high',
      [TransactionCategory.Utilities]: 'low',
      [TransactionCategory.OtherExpense]: 'medium',
    };
    
    return difficultyMap[category] || 'medium';
  }

  private analyzeMarketTrends(
    marketTrends: { date: Date; price: number }[],
    currentDate: Date
  ): { trend: 'up' | 'down' | 'stable'; confidence: number } {
    // Implement market trend analysis
    const recentTrends = marketTrends.filter(t => 
      t.date >= new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000)
    );
    
    if (recentTrends.length < 2) {
      return { trend: 'stable', confidence: 0.5 };
    }
    
    const prices = recentTrends.map(t => t.price);
    const trend = this.calculateTrend(new Map(recentTrends.map(t => 
      [t.date.toISOString().slice(0, 7), t.price]
    )));
    
    return {
      trend: trend === 'increasing' ? 'up' : trend === 'decreasing' ? 'down' : 'stable',
      confidence: 0.7,
    };
  }

  private calculateWeightGain(cattle: CattleFinancialSummary): number {
    // Implement weight gain calculation
    return 0; // Placeholder
  }

  private calculateMaintenanceCost(cattle: CattleFinancialSummary): number {
    // Implement maintenance cost calculation
    return 0; // Placeholder
  }

  private assessMarketDemand(marketTrends: { date: Date; price: number }[]): number {
    // Implement market demand assessment
    return 0; // Placeholder
  }

  private calculateOptimalSaleDate(
    cattle: CattleFinancialSummary,
    marketAnalysis: { trend: 'up' | 'down' | 'stable'; confidence: number },
    weightGain: number,
    maintenanceCost: number,
    marketDemand: number
  ): Date | null {
    // Implement optimal sale date calculation
    return null; // Placeholder
  }

  private predictSalePrice(
    cattle: CattleFinancialSummary,
    marketAnalysis: { trend: 'up' | 'down' | 'stable'; confidence: number }
  ): number {
    // Implement sale price prediction
    return 0; // Placeholder
  }

  private calculateConfidence(
    marketAnalysis: { trend: 'up' | 'down' | 'stable'; confidence: number },
    weightGain: number,
    maintenanceCost: number
  ): number {
    // Implement confidence calculation
    return 0; // Placeholder
  }
} 