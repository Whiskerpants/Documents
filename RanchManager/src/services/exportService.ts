import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { Transaction, Budget, FinancialSummary, TransactionCategory } from '../store/types/financial';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { i18n } from '../i18n';

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'excel';
  dateRange?: {
    start: Date;
    end: Date;
  };
  categories?: TransactionCategory[];
  includeBudgets?: boolean;
  includeSummary?: boolean;
  template?: string;
  language?: string;
}

export interface ExportResult {
  success: boolean;
  fileUri?: string;
  error?: string;
}

export class ExportService {
  private static instance: ExportService;
  private readonly EXPORT_DIR = `${FileSystem.documentDirectory}exports/`;
  private readonly TEMPLATES_DIR = `${FileSystem.documentDirectory}templates/`;

  private constructor() {
    this.initializeDirectories();
  }

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  private async initializeDirectories() {
    try {
      await FileSystem.makeDirectoryAsync(this.EXPORT_DIR, { intermediates: true });
      await FileSystem.makeDirectoryAsync(this.TEMPLATES_DIR, { intermediates: true });
    } catch (error) {
      console.error('Error initializing export directories:', error);
    }
  }

  // Generate PDF financial report
  async generateFinancialReport(
    transactions: Transaction[],
    budgets: Budget[],
    summary: FinancialSummary,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      const html = await this.generateReportHTML(transactions, budgets, summary, options);
      const { uri } = await Print.printToFileAsync({ html });
      
      const fileName = `financial_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      const fileUri = `${this.EXPORT_DIR}${fileName}`;
      
      await FileSystem.moveAsync({
        from: uri,
        to: fileUri
      });

      return { success: true, fileUri };
    } catch (error) {
      console.error('Error generating financial report:', error);
      return { success: false, error: error.message };
    }
  }

  // Export transactions to CSV
  async exportTransactionsToCSV(
    transactions: Transaction[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      const csvContent = this.generateCSVContent(transactions, options);
      const fileName = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      const fileUri = `${this.EXPORT_DIR}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      return { success: true, fileUri };
    } catch (error) {
      console.error('Error exporting transactions to CSV:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate tax documentation
  async generateTaxDocumentation(
    transactions: Transaction[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      const taxData = this.categorizeForTax(transactions);
      const html = await this.generateTaxHTML(taxData, options);
      const { uri } = await Print.printToFileAsync({ html });

      const fileName = `tax_documentation_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      const fileUri = `${this.EXPORT_DIR}${fileName}`;

      await FileSystem.moveAsync({
        from: uri,
        to: fileUri
      });

      return { success: true, fileUri };
    } catch (error) {
      console.error('Error generating tax documentation:', error);
      return { success: false, error: error.message };
    }
  }

  // Batch export multiple report types
  async batchExport(
    transactions: Transaction[],
    budgets: Budget[],
    summary: FinancialSummary,
    options: ExportOptions[]
  ): Promise<ExportResult[]> {
    const results: ExportResult[] = [];

    for (const option of options) {
      let result: ExportResult;

      switch (option.format) {
        case 'pdf':
          result = await this.generateFinancialReport(transactions, budgets, summary, option);
          break;
        case 'csv':
          result = await this.exportTransactionsToCSV(transactions, option);
          break;
        default:
          result = { success: false, error: 'Unsupported format' };
      }

      results.push(result);
    }

    return results;
  }

  // Share exported file
  async shareFile(fileUri: string): Promise<boolean> {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Sharing is not available on this platform');
      }

      await Sharing.shareAsync(fileUri);
      return true;
    } catch (error) {
      console.error('Error sharing file:', error);
      return false;
    }
  }

  // Clean up old export files
  async cleanupExports(maxAgeDays: number = 30): Promise<void> {
    try {
      const files = await FileSystem.readDirectoryAsync(this.EXPORT_DIR);
      const now = new Date().getTime();

      for (const file of files) {
        const fileUri = `${this.EXPORT_DIR}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);

        if (fileInfo.exists) {
          const fileAge = now - fileInfo.modificationTime;
          const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;

          if (fileAge > maxAge) {
            await FileSystem.deleteAsync(fileUri);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up exports:', error);
    }
  }

  // Private helper methods
  private async generateReportHTML(
    transactions: Transaction[],
    budgets: Budget[],
    summary: FinancialSummary,
    options: ExportOptions
  ): Promise<string> {
    const template = await this.loadTemplate(options.template || 'default');
    const locale = options.language === 'es' ? es : enUS;

    // Replace template placeholders with actual data
    return template
      .replace('{{title}}', i18n.t('financial.report.title'))
      .replace('{{date}}', format(new Date(), 'PPP', { locale }))
      .replace('{{summary}}', this.generateSummaryHTML(summary))
      .replace('{{transactions}}', this.generateTransactionsHTML(transactions))
      .replace('{{budgets}}', this.generateBudgetsHTML(budgets));
  }

  private generateCSVContent(transactions: Transaction[], options: ExportOptions): string {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Related Entity'];
    const rows = transactions.map(t => [
      format(new Date(t.date), 'yyyy-MM-dd'),
      t.type,
      t.category,
      t.description,
      t.amount.toString(),
      t.relatedEntityId || ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  private categorizeForTax(transactions: Transaction[]): any {
    // Implement tax categorization logic
    return transactions.reduce((acc, transaction) => {
      const category = this.getTaxCategory(transaction.category);
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(transaction);
      return acc;
    }, {});
  }

  private getTaxCategory(category: TransactionCategory): string {
    // Map transaction categories to tax categories
    const taxCategories: Record<TransactionCategory, string> = {
      [TransactionCategory.Feed]: 'Operating Expenses',
      [TransactionCategory.Veterinary]: 'Operating Expenses',
      [TransactionCategory.Equipment]: 'Capital Expenses',
      [TransactionCategory.Labor]: 'Operating Expenses',
      [TransactionCategory.Facilities]: 'Capital Expenses',
      [TransactionCategory.Transportation]: 'Operating Expenses',
      [TransactionCategory.Marketing]: 'Operating Expenses',
      [TransactionCategory.Insurance]: 'Operating Expenses',
      [TransactionCategory.Taxes]: 'Taxes',
      [TransactionCategory.Utilities]: 'Operating Expenses',
      [TransactionCategory.OtherExpense]: 'Other Expenses',
      [TransactionCategory.CattleSales]: 'Income',
      [TransactionCategory.BreedingServices]: 'Income',
      [TransactionCategory.MilkSales]: 'Income',
      [TransactionCategory.OtherIncome]: 'Other Income',
    };

    return taxCategories[category] || 'Other';
  }

  private async loadTemplate(templateName: string): Promise<string> {
    try {
      const templateUri = `${this.TEMPLATES_DIR}${templateName}.html`;
      const templateInfo = await FileSystem.getInfoAsync(templateUri);

      if (templateInfo.exists) {
        return await FileSystem.readAsStringAsync(templateUri);
      }

      // Return default template if custom template doesn't exist
      return this.getDefaultTemplate();
    } catch (error) {
      console.error('Error loading template:', error);
      return this.getDefaultTemplate();
    }
  }

  private getDefaultTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>{{title}}</title>
          <style>
            body { font-family: Arial, sans-serif; }
            .header { text-align: center; margin-bottom: 20px; }
            .section { margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; border: 1px solid #ddd; }
            th { background-color: #f5f5f5; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>{{title}}</h1>
            <p>{{date}}</p>
          </div>
          <div class="section">
            <h2>Summary</h2>
            {{summary}}
          </div>
          <div class="section">
            <h2>Transactions</h2>
            {{transactions}}
          </div>
          <div class="section">
            <h2>Budgets</h2>
            {{budgets}}
          </div>
        </body>
      </html>
    `;
  }

  private generateSummaryHTML(summary: FinancialSummary): string {
    return `
      <table>
        <tr>
          <th>Total Income</th>
          <td>${summary.totalIncome.toLocaleString(undefined, {
            style: 'currency',
            currency: 'USD'
          })}</td>
        </tr>
        <tr>
          <th>Total Expenses</th>
          <td>${summary.totalExpenses.toLocaleString(undefined, {
            style: 'currency',
            currency: 'USD'
          })}</td>
        </tr>
        <tr>
          <th>Net Profit</th>
          <td>${summary.netProfit.toLocaleString(undefined, {
            style: 'currency',
            currency: 'USD'
          })}</td>
        </tr>
      </table>
    `;
  }

  private generateTransactionsHTML(transactions: Transaction[]): string {
    return `
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Category</th>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.map(t => `
            <tr>
              <td>${format(new Date(t.date), 'yyyy-MM-dd')}</td>
              <td>${t.type}</td>
              <td>${t.category}</td>
              <td>${t.description}</td>
              <td>${t.amount.toLocaleString(undefined, {
                style: 'currency',
                currency: 'USD'
              })}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  private generateBudgetsHTML(budgets: Budget[]): string {
    return `
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Total</th>
            <th>Spent</th>
            <th>Remaining</th>
          </tr>
        </thead>
        <tbody>
          ${budgets.map(b => `
            <tr>
              <td>${b.name}</td>
              <td>${b.total.toLocaleString(undefined, {
                style: 'currency',
                currency: 'USD'
              })}</td>
              <td>${b.spent.toLocaleString(undefined, {
                style: 'currency',
                currency: 'USD'
              })}</td>
              <td>${(b.total - b.spent).toLocaleString(undefined, {
                style: 'currency',
                currency: 'USD'
              })}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  private async generateTaxHTML(taxData: any, options: ExportOptions): Promise<string> {
    const template = await this.loadTemplate('tax');
    const locale = options.language === 'es' ? es : enUS;

    return template
      .replace('{{title}}', i18n.t('financial.tax.title'))
      .replace('{{date}}', format(new Date(), 'PPP', { locale }))
      .replace('{{taxData}}', this.formatTaxData(taxData));
  }

  private formatTaxData(taxData: any): string {
    return Object.entries(taxData)
      .map(([category, transactions]: [string, any]) => `
        <div class="tax-category">
          <h3>${category}</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map((t: Transaction) => `
                <tr>
                  <td>${format(new Date(t.date), 'yyyy-MM-dd')}</td>
                  <td>${t.description}</td>
                  <td>${t.amount.toLocaleString(undefined, {
                    style: 'currency',
                    currency: 'USD'
                  })}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `).join('');
  }
} 