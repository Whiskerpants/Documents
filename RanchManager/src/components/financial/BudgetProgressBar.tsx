import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/formatters';

export type BudgetProgressBarSize = 'sm' | 'md' | 'lg';

interface BudgetProgressBarProps {
  spent: number;
  total: number;
  size?: BudgetProgressBarSize;
  showAmount?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const getProgressColor = (progress: number): string => {
  if (progress >= 0.95) return '#F44336'; // Red for over 95%
  if (progress >= 0.75) return '#FFC107'; // Yellow for 75-95%
  return '#4CAF50'; // Green for under 75%
};

const getSizeStyles = (size: BudgetProgressBarSize) => {
  switch (size) {
    case 'sm':
      return {
        height: 8,
        fontSize: 12,
        paddingVertical: 4,
      };
    case 'lg':
      return {
        height: 16,
        fontSize: 16,
        paddingVertical: 8,
      };
    default: // md
      return {
        height: 12,
        fontSize: 14,
        paddingVertical: 6,
      };
  }
};

export const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  spent,
  total,
  size = 'md',
  showAmount = true,
  style,
  textStyle,
}) => {
  const { t } = useTranslation();
  const progress = Math.min(spent / total, 1);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const sizeStyles = getSizeStyles(size);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const width = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const remaining = total - spent;
  const percentage = Math.round(progress * 100);

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.progressContainer, { height: sizeStyles.height }]}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width,
              height: sizeStyles.height,
              backgroundColor: getProgressColor(progress),
            },
          ]}
        />
      </View>
      {showAmount && (
        <View style={styles.textContainer}>
          <Text style={[styles.text, { fontSize: sizeStyles.fontSize }, textStyle]}>
            {formatCurrency(spent)} / {formatCurrency(total)}
          </Text>
          <Text
            style={[
              styles.percentage,
              { fontSize: sizeStyles.fontSize },
              { color: getProgressColor(progress) },
              textStyle,
            ]}
          >
            {percentage}%
          </Text>
        </View>
      )}
      {remaining > 0 && (
        <Text style={[styles.remaining, { fontSize: sizeStyles.fontSize - 2 }, textStyle]}>
          {t('budget.remaining', { amount: formatCurrency(remaining) })}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  progressContainer: {
    width: '100%',
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    borderRadius: 4,
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  text: {
    color: '#333',
    fontWeight: '500',
  },
  percentage: {
    fontWeight: 'bold',
  },
  remaining: {
    color: '#666',
    marginTop: 2,
  },
}); 