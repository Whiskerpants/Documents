import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootState, AppDispatch } from '../../store/store';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FinancialStackParamList } from '../../navigation/FinancialNavigator';
import { FinancialChart, ChartType } from '../../components/financial/FinancialChart';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

interface ReportDetailProps {
  route: {
    params: {
      reportId: string;
    };
  };
  navigation: NativeStackNavigationProp<FinancialStackParamList, 'ReportDetail'>;
}

export const ReportDetail: React.FC<ReportDetailProps> = ({ route, navigation }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const report = useSelector((state: RootState) =>
    state.financial.reports.items.find((r) => r.id === route.params.reportId)
  );

  const formatDate = (date: Date) => {
    return format(new Date(date), 'PPP', {
      locale: i18n.language === 'es' ? es : enUS,
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: t('report.share.message', {
          name: report?.name,
          date: formatDate(new Date()),
        }),
      });
    } catch (error) {
      Alert.alert(t('common.error'), t('report.share.error'));
    }
  };

  const handleExport = async (format: 'pdf' | 'csv') => {
    try {
      setIsExporting(true);
      // TODO: Implement export functionality
      Alert.alert(t('common.success'), t('report.export.success'));
    } catch (error) {
      Alert.alert(t('common.error'), t('report.export.error'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      setIsSaving(true);
      // TODO: Implement save as template functionality
      Alert.alert(t('common.success'), t('report.saveTemplate.success'));
    } catch (error) {
      Alert.alert(t('common.error'), t('report.saveTemplate.error'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!report) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B7302" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{report.name}</Text>
          <Text style={styles.date}>
            {formatDate(report.createdAt)}
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={handleShare}
          >
            <Icon name="share-variant" size={24} color="#3B7302" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={handleSaveTemplate}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#3B7302" />
            ) : (
              <Icon name="content-save" size={24} color="#3B7302" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.exportButtons}>
        <TouchableOpacity
          style={[styles.exportButton, styles.pdfButton]}
          onPress={() => handleExport('pdf')}
          disabled={isExporting}
        >
          <Icon name="file-pdf-box" size={20} color="#FFF" />
          <Text style={styles.exportButtonText}>PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.exportButton, styles.csvButton]}
          onPress={() => handleExport('csv')}
          disabled={isExporting}
        >
          <Icon name="file-excel" size={20} color="#FFF" />
          <Text style={styles.exportButtonText}>CSV</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('report.summary')}</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('report.totalIncome')}</Text>
            <Text style={styles.summaryValue}>
              {t('common.currency', {
                value: report.results.summary.totalIncome,
                currency: 'USD',
              })}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('report.totalExpenses')}</Text>
            <Text style={styles.summaryValue}>
              {t('common.currency', {
                value: report.results.summary.totalExpenses,
                currency: 'USD',
              })}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('report.netProfit')}</Text>
            <Text style={styles.summaryValue}>
              {t('common.currency', {
                value: report.results.summary.netProfit,
                currency: 'USD',
              })}
            </Text>
          </View>
        </View>
      </View>

      {report.results.charts && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('report.charts')}</Text>
          {report.results.charts.map((chart, index) => (
            <View key={index} style={styles.chartContainer}>
              <Text style={styles.chartTitle}>{chart.title}</Text>
              <FinancialChart
                type={chart.type as ChartType}
                data={chart.data}
                height={220}
                showLegend
                showAxis
                showGrid
                showValues
              />
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('report.details')}</Text>
        <View style={styles.table}>
          {Object.entries(report.results.details).map(([key, value], index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableHeaderCell}>{key}</Text>
              <Text style={styles.tableCell}>
                {typeof value === 'number'
                  ? t('common.currency', {
                      value,
                      currency: 'USD',
                    })
                  : String(value)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  shareButton: {
    backgroundColor: '#E8F5E9',
  },
  saveButton: {
    backgroundColor: '#E8F5E9',
  },
  exportButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  pdfButton: {
    backgroundColor: '#F44336',
  },
  csvButton: {
    backgroundColor: '#4CAF50',
  },
  exportButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  chartContainer: {
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  table: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tableHeaderCell: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tableCell: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: '#666',
  },
}); 