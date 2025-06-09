import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  LayoutChangeEvent,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';

export type ChartType = 'line' | 'bar' | 'pie' | 'area';

export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }[];
}

export interface ChartConfig {
  backgroundColor?: string;
  backgroundGradientFrom?: string;
  backgroundGradientTo?: string;
  decimalPlaces?: number;
  color?: (opacity: number) => string;
  labelColor?: (opacity: number) => string;
  style?: ViewStyle;
  propsForDots?: {
    r?: number;
    strokeWidth?: number;
    stroke?: string;
  };
}

interface FinancialChartProps {
  type: ChartType;
  data: ChartData;
  config?: ChartConfig;
  width?: number;
  height?: number;
  showLegend?: boolean;
  showAxis?: boolean;
  showGrid?: boolean;
  showValues?: boolean;
  onDataPointPress?: (data: { x: number; y: number; index: number }) => void;
  style?: ViewStyle;
  legendStyle?: TextStyle;
}

const defaultConfig: ChartConfig = {
  backgroundColor: '#FFF',
  backgroundGradientFrom: '#FFF',
  backgroundGradientTo: '#FFF',
  decimalPlaces: 2,
  color: (opacity = 1) => `rgba(59, 115, 2, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#3B7302',
  },
};

export const FinancialChart: React.FC<FinancialChartProps> = ({
  type,
  data,
  config = {},
  width,
  height = 220,
  showLegend = true,
  showAxis = true,
  showGrid = true,
  showValues = true,
  onDataPointPress,
  style,
  legendStyle,
}) => {
  const { t } = useTranslation();
  const [chartWidth, setChartWidth] = useState(width || Dimensions.get('window').width - 32);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const scale = useSharedValue(1);

  const handleLayout = (event: LayoutChangeEvent) => {
    if (!width) {
      setChartWidth(event.nativeEvent.layout.width);
    }
  };

  const handleDataPointPress = (data: { x: number; y: number; index: number }) => {
    setSelectedPoint(data.index);
    scale.value = withSpring(1.1);
    onDataPointPress?.(data);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const renderChart = () => {
    const chartConfig = { ...defaultConfig, ...config };

    switch (type) {
      case 'line':
        return (
          <LineChart
            data={data}
            width={chartWidth}
            height={height}
            chartConfig={chartConfig}
            bezier
            style={[styles.chart, style]}
            onDataPointClick={handleDataPointPress}
            withDots={true}
            withShadow={false}
            withInnerLines={showGrid}
            withOuterLines={showAxis}
            withVerticalLines={showGrid}
            withHorizontalLines={showGrid}
            withVerticalLabels={showAxis}
            withHorizontalLabels={showAxis}
            fromZero
          />
        );
      case 'bar':
        return (
          <BarChart
            data={data}
            width={chartWidth}
            height={height}
            chartConfig={chartConfig}
            style={[styles.chart, style]}
            showValuesOnTopOfBars={showValues}
            withInnerLines={showGrid}
            withOuterLines={showAxis}
            withVerticalLines={showGrid}
            withHorizontalLines={showGrid}
            withVerticalLabels={showAxis}
            withHorizontalLabels={showAxis}
            fromZero
          />
        );
      case 'pie':
        return (
          <PieChart
            data={data.datasets[0].data.map((value, index) => ({
              value,
              color: data.datasets[0].color?.(1) || `rgba(59, 115, 2, ${1 - index * 0.2})`,
              key: data.labels[index],
            }))}
            width={chartWidth}
            height={height}
            chartConfig={chartConfig}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="15"
            style={[styles.chart, style]}
            absolute
          />
        );
      case 'area':
        return (
          <LineChart
            data={data}
            width={chartWidth}
            height={height}
            chartConfig={{
              ...chartConfig,
              fillShadowGradient: chartConfig.color?.(0.2),
              fillShadowGradientOpacity: 0.5,
            }}
            bezier
            style={[styles.chart, style]}
            onDataPointClick={handleDataPointPress}
            withDots={true}
            withShadow={true}
            withInnerLines={showGrid}
            withOuterLines={showAxis}
            withVerticalLines={showGrid}
            withHorizontalLines={showGrid}
            withVerticalLabels={showAxis}
            withHorizontalLabels={showAxis}
            fromZero
          />
        );
      default:
        return null;
    }
  };

  const renderLegend = () => {
    if (!showLegend) return null;

    return (
      <View style={styles.legendContainer}>
        {data.datasets.map((dataset, index) => (
          <View key={index} style={styles.legendItem}>
            <View
              style={[
                styles.legendColor,
                { backgroundColor: dataset.color?.(1) || defaultConfig.color?.(1) },
              ]}
            />
            <Text style={[styles.legendText, legendStyle]}>
              {t(`chart.dataset.${index}`)}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <Animated.View style={[styles.chartContainer, animatedStyle]}>
        {renderChart()}
      </Animated.View>
      {renderLegend()}
      {selectedPoint !== null && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>
            {data.labels[selectedPoint]}:{' '}
            {t('common.currency', {
              value: data.datasets[0].data[selectedPoint],
              currency: 'USD',
            })}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  tooltipText: {
    color: '#FFF',
    fontSize: 12,
  },
}); 