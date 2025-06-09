export type FinancialStackParamList = {
  FinancialHome: undefined;
  TransactionList: undefined;
  TransactionDetail: { transactionId: string };
  AddEditTransaction: { transactionId?: string };
  BudgetList: undefined;
  BudgetDetail: { budgetId: string };
  AddEditBudget: { budgetId?: string };
  Reports: undefined;
  ReportDetail: { reportId: string };
  EntityProfitability: { entityId: string; entityType: 'cattle' | 'group' };
}; 