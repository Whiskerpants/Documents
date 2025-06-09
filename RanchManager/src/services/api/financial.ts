import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
  Query,
  CollectionReference,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import {
  Transaction,
  Budget,
  Report,
  TransactionFilters,
  BudgetFilters,
  ReportFilters,
  FinancialSummary,
  ReportType,
} from '../../store/types/financial';
import { firestore } from '../firebase/firebase';

const COLLECTIONS = {
  BUDGETS: 'budgets'
} as const;

class FinancialApi {
  private readonly transactionsCollection = 'transactions';
  private readonly reportsCollection = 'reports';

  // Helper function to convert Firestore Timestamp to Date
  private convertTimestampToDate(data: DocumentData): any {
    const result = { ...data };
    for (const key in result) {
      if (result[key] instanceof Timestamp) {
        result[key] = result[key].toDate();
      }
    }
    return result;
  }

  // Transaction methods
  async getTransactions(filters: TransactionFilters): Promise<Transaction[]> {
    try {
      let q = collection(db, this.transactionsCollection);

      if (filters.startDate) {
        q = query(q, where('date', '>=', Timestamp.fromDate(filters.startDate)));
      }
      if (filters.endDate) {
        q = query(q, where('date', '<=', Timestamp.fromDate(filters.endDate)));
      }
      if (filters.type) {
        q = query(q, where('type', '==', filters.type));
      }
      if (filters.categories?.length) {
        q = query(q, where('category', 'in', filters.categories));
      }
      if (filters.relatedEntityId) {
        q = query(q, where('relatedEntityId', '==', filters.relatedEntityId));
      }
      if (filters.tags?.length) {
        q = query(q, where('tags', 'array-contains-any', filters.tags));
      }

      const sortField = filters.sortBy || 'date';
      const sortOrder = filters.sortOrder || 'desc';
      q = query(q, orderBy(sortField, sortOrder));

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...this.convertTimestampToDate(doc.data()),
      })) as Transaction[];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    try {
      const docRef = await addDoc(collection(db, this.transactionsCollection), {
        ...transaction,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return {
        id: docRef.id,
        ...transaction,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  async updateTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      const docRef = doc(db, this.transactionsCollection, transaction.id);
      await updateDoc(docRef, {
        ...transaction,
        updatedAt: Timestamp.now(),
      });
      return transaction;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.transactionsCollection, id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }

  // Budget methods
  async getBudgets(filters?: { type?: 'all' | 'active' | 'inactive'; searchQuery?: string }) {
    const budgetsRef = collection(firestore, COLLECTIONS.BUDGETS) as CollectionReference<DocumentData>;
    const q = filters?.type && filters.type !== 'all'
      ? query(budgetsRef, where('isActive', '==', filters.type === 'active'))
      : budgetsRef;

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Budget[];
  }

  async getBudget(id: string) {
    const budgetRef = doc(firestore, COLLECTIONS.BUDGETS, id);
    const snapshot = await getDoc(budgetRef);
    if (!snapshot.exists()) {
      throw new Error('Budget not found');
    }
    return {
      id: snapshot.id,
      ...snapshot.data()
    } as Budget;
  }

  async createBudget(budget: Omit<Budget, 'id'>) {
    const budgetsRef = collection(firestore, COLLECTIONS.BUDGETS) as CollectionReference<DocumentData>;
    const docRef = await addDoc(budgetsRef, budget);
    return {
      id: docRef.id,
      ...budget
    } as Budget;
  }

  async updateBudget(id: string, budget: Partial<Budget>) {
    const budgetRef = doc(firestore, COLLECTIONS.BUDGETS, id);
    await updateDoc(budgetRef, budget);
    return {
      id,
      ...budget
    } as Budget;
  }

  async deleteBudget(id: string) {
    const budgetRef = doc(firestore, COLLECTIONS.BUDGETS, id);
    await deleteDoc(budgetRef);
  }

  // Report methods
  async getReports(filters: ReportFilters): Promise<Report[]> {
    try {
      let q = collection(db, this.reportsCollection);

      if (filters.type) {
        q = query(q, where('type', '==', filters.type));
      }
      if (filters.startDate) {
        q = query(
          q,
          where('parameters.startDate', '>=', Timestamp.fromDate(filters.startDate))
        );
      }
      if (filters.endDate) {
        q = query(
          q,
          where('parameters.endDate', '<=', Timestamp.fromDate(filters.endDate))
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...this.convertTimestampToDate(doc.data()),
      })) as Report[];
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  }

  async generateReport(
    type: ReportType,
    parameters: Record<string, any>
  ): Promise<Report> {
    try {
      const report: Omit<Report, 'id'> = {
        name: `${type} Report`,
        type,
        parameters,
        dateGenerated: new Date(),
        results: await this.calculateReportResults(type, parameters),
        createdAt: new Date(),
        createdBy: 'system', // TODO: Get from auth context
      };

      const docRef = await addDoc(collection(db, this.reportsCollection), {
        ...report,
        dateGenerated: Timestamp.fromDate(report.dateGenerated),
        createdAt: Timestamp.fromDate(report.createdAt),
      });

      return {
        id: docRef.id,
        ...report,
      };
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  async deleteReport(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.reportsCollection, id));
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  }

  // Summary methods
  async getFinancialSummary(filters: TransactionFilters): Promise<FinancialSummary> {
    try {
      const transactions = await this.getTransactions(filters);
      const summary: FinancialSummary = {
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
        categoryTotals: {} as Record<string, number>,
        entityTotals: {},
        periodStart: filters.startDate || new Date(0),
        periodEnd: filters.endDate || new Date(),
      };

      transactions.forEach((transaction) => {
        const amount = transaction.amount;
        if (transaction.type === 'income') {
          summary.totalIncome += amount;
        } else {
          summary.totalExpenses += amount;
        }

        // Update category totals
        if (!summary.categoryTotals[transaction.category]) {
          summary.categoryTotals[transaction.category] = 0;
        }
        summary.categoryTotals[transaction.category] += amount;

        // Update entity totals if applicable
        if (transaction.relatedEntityId) {
          if (!summary.entityTotals[transaction.relatedEntityId]) {
            summary.entityTotals[transaction.relatedEntityId] = 0;
          }
          summary.entityTotals[transaction.relatedEntityId] +=
            transaction.type === 'income' ? amount : -amount;
        }
      });

      summary.netProfit = summary.totalIncome - summary.totalExpenses;
      return summary;
    } catch (error) {
      console.error('Error calculating financial summary:', error);
      throw error;
    }
  }

  // Helper methods
  private async calculateReportResults(
    type: ReportType,
    parameters: Record<string, any>
  ): Promise<any> {
    // Implement report-specific calculations here
    switch (type) {
      case ReportType.ProfitLoss:
        return this.calculateProfitLossReport(parameters);
      case ReportType.CashFlow:
        return this.calculateCashFlowReport(parameters);
      case ReportType.BudgetVariance:
        return this.calculateBudgetVarianceReport(parameters);
      case ReportType.CategoryAnalysis:
        return this.calculateCategoryAnalysisReport(parameters);
      case ReportType.EntityProfitability:
        return this.calculateEntityProfitabilityReport(parameters);
      default:
        throw new Error(`Unsupported report type: ${type}`);
    }
  }

  private async calculateProfitLossReport(parameters: Record<string, any>) {
    // Implement profit/loss report calculations
    return {};
  }

  private async calculateCashFlowReport(parameters: Record<string, any>) {
    // Implement cash flow report calculations
    return {};
  }

  private async calculateBudgetVarianceReport(parameters: Record<string, any>) {
    // Implement budget variance report calculations
    return {};
  }

  private async calculateCategoryAnalysisReport(parameters: Record<string, any>) {
    // Implement category analysis report calculations
    return {};
  }

  private async calculateEntityProfitabilityReport(parameters: Record<string, any>) {
    // Implement entity profitability report calculations
    return {};
  }

  // Export methods
  async exportTransactions(
    format: 'csv' | 'pdf',
    filters: TransactionFilters
  ): Promise<string> {
    try {
      const transactions = await this.getTransactions(filters);
      // Implement export logic here
      return 'export_url';
    } catch (error) {
      console.error('Error exporting transactions:', error);
      throw error;
    }
  }

  async exportReport(reportId: string, format: 'csv' | 'pdf'): Promise<string> {
    try {
      const reportDoc = await getDoc(doc(db, this.reportsCollection, reportId));
      if (!reportDoc.exists()) {
        throw new Error('Report not found');
      }
      // Implement export logic here
      return 'export_url';
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  }

  // File upload methods
  async uploadAttachment(
    file: File,
    transactionId: string
  ): Promise<string> {
    try {
      const storageRef = ref(
        storage,
        `transactions/${transactionId}/${file.name}`
      );
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading attachment:', error);
      throw error;
    }
  }
}

export const financialApi = new FinancialApi(); 