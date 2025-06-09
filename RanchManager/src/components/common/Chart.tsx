import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useTheme } from '@react-navigation/native';

interface ChartProps {
  type: 'line' | 'bar' | 'pie';
  data: any;
  height?: number;
  width?: number;
  chartConfig?: any;
}

export const Chart: React.FC<ChartProps> = ({
  type,
  data,
  height = 220,
  width = Dimensions.get('window').width - 32,
  chartConfig,
}) => {
  const { colors } = useTheme();

  const defaultChartConfig = {
    backgroundColor: colors.background,
    backgroundGradientFrom: colors.background,
    backgroundGradientTo: colors.background,
    decimalPlaces: 0,
    color: (opacity = 1) => colors.text,
    labelColor: (opacity = 1) => colors.text,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
    },
  };

  const config = { ...defaultChartConfig, ...chartConfig };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart
            data={data}
            width={width}
            height={height}
            chartConfig={config}
            bezier
            style={styles.chart}
          />
        );
      case 'bar':
        return (
          <BarChart
            data={data}
            width={width}
            height={height}
            yAxisLabel="$"
            yAxisSuffix=""
            chartConfig={config}
            verticalLabelRotation={30}
            showValuesOnTopOfBars
            fromZero
          />
        );
      case 'pie':
        return (
          <PieChart
            data={data}
            width={width}
            height={height}
            chartConfig={config}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        );
      default:
        return null;
    }
  };

  return <View style={styles.container}>{renderChart()}</View>;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
}); 