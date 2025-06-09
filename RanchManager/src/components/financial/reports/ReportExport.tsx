import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Share from 'react-native-share';

interface ReportExportProps {
  onExport: (format: 'pdf' | 'csv') => Promise<void>;
  disabled?: boolean;
}

export const ReportExport: React.FC<ReportExportProps> = ({
  onExport,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const handleExport = async (format: 'pdf' | 'csv') => {
    try {
      await onExport(format);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleShare = async () => {
    try {
      const shareOptions = {
        title: t('financial.reports.export.shareTitle'),
        message: t('financial.reports.export.shareMessage'),
        url: 'file://path/to/exported/report.pdf', // This should be the actual path to the exported file
        type: 'application/pdf',
      };

      await Share.open(shareOptions);
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.exportButton,
          { backgroundColor: colors.primary },
          disabled && styles.disabled,
        ]}
        onPress={() => handleExport('pdf')}
        disabled={disabled}
      >
        <Icon name="file-pdf-box" size={20} color="#fff" />
        <Text style={styles.buttonText}>PDF</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.exportButton,
          { backgroundColor: colors.primary },
          disabled && styles.disabled,
        ]}
        onPress={() => handleExport('csv')}
        disabled={disabled}
      >
        <Icon name="file-excel" size={20} color="#fff" />
        <Text style={styles.buttonText}>CSV</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.shareButton,
          { backgroundColor: colors.primary },
          disabled && styles.disabled,
        ]}
        onPress={handleShare}
        disabled={disabled}
      >
        <Icon name="share-variant" size={20} color="#fff" />
        <Text style={styles.buttonText}>
          {t('financial.reports.export.share')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.5,
  },
}); 