import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { ReportParameters } from '../../components/financial/reports/ReportParameters';
import { IncomeStatement } from '../../components/financial/reports/IncomeStatement';
import { ExpenseBreakdown } from '../../components/financial/reports/ExpenseBreakdown';
import { BudgetPerformance } from '../../components/financial/reports/BudgetPerformance';
import { EntityProfitability } from '../../components/financial/reports/EntityProfitability';
import { ReportExport } from '../../components/financial/reports/ReportExport';
import { ReportType, ReportParameters as ReportParams } from '../../store/types/financial';
import { generateReport } from '../../store/actions/financialActions';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const Reports: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const [selectedReport, setSelectedReport] = useState<ReportType>('income');
  const [parameters, setParameters] = useState<ReportParams>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
    categories: [],
    entities: [],
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { reports, loading } = useSelector((state: RootState) => state.financial.reports);

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      await dispatch<any>(generateReport(selectedReport, parameters));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'csv') => {
    try {
      setIsGenerating(true);
      setError(null);
      // TODO: Implement export functionality
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export report');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderReportContent = () => {
    if (loading || isGenerating) {
      return <LoadingSpinner />;
    }

    if (error) {
      return <ErrorMessage message={error} />;
    }

    switch (selectedReport) {
      case 'income':
        return <IncomeStatement data={reports.income} />;
      case 'expense':
        return <ExpenseBreakdown data={reports.expense} />;
      case 'budget':
        return <BudgetPerformance data={reports.budget} />;
      case 'entity':
        return <EntityProfitability data={reports.entity} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('financial.reports.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            {t('financial.reports.subtitle')}
          </Text>
        </View>

        <View style={styles.reportTypes}>
          <TouchableOpacity
            style={[
              styles.reportTypeButton,
              selectedReport === 'income' && styles.selectedReport,
              { borderColor: colors.border },
            ]}
            onPress={() => setSelectedReport('income')}
          >
            <Text style={[styles.reportTypeText, { color: colors.text }]}>
              {t('financial.reports.types.income')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.reportTypeButton,
              selectedReport === 'expense' && styles.selectedReport,
              { borderColor: colors.border },
            ]}
            onPress={() => setSelectedReport('expense')}
          >
            <Text style={[styles.reportTypeText, { color: colors.text }]}>
              {t('financial.reports.types.expense')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.reportTypeButton,
              selectedReport === 'budget' && styles.selectedReport,
              { borderColor: colors.border },
            ]}
            onPress={() => setSelectedReport('budget')}
          >
            <Text style={[styles.reportTypeText, { color: colors.text }]}>
              {t('financial.reports.types.budget')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.reportTypeButton,
              selectedReport === 'entity' && styles.selectedReport,
              { borderColor: colors.border },
            ]}
            onPress={() => setSelectedReport('entity')}
          >
            <Text style={[styles.reportTypeText, { color: colors.text }]}>
              {t('financial.reports.types.entity')}
            </Text>
          </TouchableOpacity>
        </View>

        <ReportParameters
          parameters={parameters}
          onChange={setParameters}
          reportType={selectedReport}
        />

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.generateButton, { backgroundColor: colors.primary }]}
            onPress={handleGenerateReport}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.generateButtonText}>
                {t('financial.reports.generate')}
              </Text>
            )}
          </TouchableOpacity>

          <ReportExport
            onExport={handleExport}
            disabled={isGenerating || !reports[selectedReport]}
          />
        </View>

        {renderReportContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  reportTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  reportTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 120,
    alignItems: 'center',
  },
  selectedReport: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  reportTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  generateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 