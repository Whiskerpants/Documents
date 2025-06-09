import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { format, differenceInYears, differenceInMonths } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LineageRecord } from '../../store/types/breeding';

export enum NodeType {
  Root = 'root',
  Ancestor = 'ancestor',
  Descendant = 'descendant',
  Unknown = 'unknown',
}

interface LineageTreeNodeProps {
  record: LineageRecord;
  nodeType: NodeType;
  depth: number;
  onPress?: (record: LineageRecord) => void;
  onLongPress?: (record: LineageRecord) => void;
  onExpand?: (record: LineageRecord) => void;
  onCollapse?: (record: LineageRecord) => void;
  isExpanded?: boolean;
  hasChildren?: boolean;
  metrics?: {
    label: string;
    value: string | number;
    unit?: string;
  }[];
  layout?: 'vertical' | 'horizontal';
  scale?: number;
  onScaleChange?: (scale: number) => void;
}

export const LineageTreeNode: React.FC<LineageTreeNodeProps> = ({
  record,
  nodeType,
  depth,
  onPress,
  onLongPress,
  onExpand,
  onCollapse,
  isExpanded = false,
  hasChildren = false,
  metrics = [],
  layout = 'vertical',
  scale = 1,
  onScaleChange,
}) => {
  const { t } = useTranslation();
  const [showMetrics, setShowMetrics] = useState(false);
  const scaleAnim = useRef(new Animated.Value(scale)).current;
  const pan = useRef(new Animated.ValueXY()).current;

  const getAgeText = () => {
    const years = differenceInYears(new Date(), record.birthDate);
    const months = differenceInMonths(new Date(), record.birthDate) % 12;
    
    if (years > 0) {
      return t('common.age.years', { years, months });
    }
    return t('common.age.months', { months });
  };

  const getNodeStyle = () => {
    switch (nodeType) {
      case NodeType.Root:
        return styles.rootNode;
      case NodeType.Ancestor:
        return styles.ancestorNode;
      case NodeType.Descendant:
        return styles.descendantNode;
      case NodeType.Unknown:
        return styles.unknownNode;
      default:
        return {};
    }
  };

  const getGenderColor = () => {
    // This would be determined by the animal's gender
    return '#2196F3'; // Default to blue for male
  };

  const getBreedColor = () => {
    // This would be determined by the animal's breed
    return '#4CAF50'; // Default to green
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        if (onScaleChange) {
          const newScale = Math.max(0.5, Math.min(2, scale + gesture.dy / 100));
          onScaleChange(newScale);
          scaleAnim.setValue(newScale);
        }
      },
      onPanResponderRelease: () => {
        // Handle release if needed
      },
    })
  ).current;

  const handlePress = () => {
    if (onPress) {
      onPress(record);
    }
  };

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress(record);
    }
  };

  const toggleMetrics = () => {
    setShowMetrics(!showMetrics);
  };

  const toggleExpand = () => {
    if (isExpanded && onCollapse) {
      onCollapse(record);
    } else if (!isExpanded && onExpand) {
      onExpand(record);
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        getNodeStyle(),
        {
          transform: [
            { scale: scaleAnim },
            { translateX: pan.x },
            { translateY: pan.y },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={500}
      >
        <View style={styles.header}>
          {record.geneticProfile?.dnaTestResults && (
            <View style={styles.dnaBadge}>
              <Icon name="dna" size={12} color="#FFF" />
            </View>
          )}
          <Text style={styles.name}>{record.animalName}</Text>
          <Text style={styles.id}>#{record.animalId}</Text>
        </View>

        <View style={styles.info}>
          <View style={styles.breedContainer}>
            <View
              style={[
                styles.breedIndicator,
                { backgroundColor: getBreedColor() },
              ]}
            />
            <Text style={styles.breed}>{record.breed}</Text>
          </View>

          <View style={styles.ageContainer}>
            <Icon name="calendar" size={14} color="#666" />
            <Text style={styles.age}>{getAgeText()}</Text>
          </View>
        </View>

        {metrics.length > 0 && (
          <TouchableOpacity
            style={styles.metricsToggle}
            onPress={toggleMetrics}
          >
            <Icon
              name={showMetrics ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#666"
            />
          </TouchableOpacity>
        )}

        {showMetrics && (
          <View style={styles.metricsContainer}>
            {metrics.map((metric, index) => (
              <View key={index} style={styles.metric}>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricValue}>
                  {metric.value}
                  {metric.unit && (
                    <Text style={styles.metricUnit}> {metric.unit}</Text>
                  )}
                </Text>
              </View>
            ))}
          </View>
        )}

        {hasChildren && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={toggleExpand}
          >
            <Icon
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {layout === 'vertical' && (
        <View style={styles.verticalConnector} />
      )}
      {layout === 'horizontal' && (
        <View style={styles.horizontalConnector} />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 200,
    margin: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rootNode: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  ancestorNode: {
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  descendantNode: {
    borderWidth: 1,
    borderColor: '#FFA500',
  },
  unknownNode: {
    borderWidth: 1,
    borderColor: '#9E9E9E',
    opacity: 0.7,
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dnaBadge: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  id: {
    fontSize: 12,
    color: '#666',
  },
  info: {
    marginBottom: 8,
  },
  breedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  breedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  breed: {
    fontSize: 14,
    color: '#666',
  },
  ageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  age: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  metricsToggle: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  metricsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  metric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
  },
  metricValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  metricUnit: {
    fontSize: 10,
    color: '#666',
  },
  expandButton: {
    alignItems: 'center',
    paddingTop: 8,
  },
  verticalConnector: {
    position: 'absolute',
    left: '50%',
    bottom: -16,
    width: 2,
    height: 16,
    backgroundColor: '#CCC',
  },
  horizontalConnector: {
    position: 'absolute',
    right: -16,
    top: '50%',
    width: 16,
    height: 2,
    backgroundColor: '#CCC',
  },
}); 