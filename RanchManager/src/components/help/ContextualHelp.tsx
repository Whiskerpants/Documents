import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Text } from '../common/Text';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';

interface HelpStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector or ref for the element to highlight
  position: 'top' | 'bottom' | 'left' | 'right';
  offset?: number;
}

interface ContextualHelpProps {
  steps: HelpStep[];
  isVisible: boolean;
  onClose: () => void;
  onComplete: () => void;
  currentStep?: number;
  onStepChange?: (step: number) => void;
}

export const ContextualHelp: React.FC<ContextualHelpProps> = ({
  steps,
  isVisible,
  onClose,
  onComplete,
  currentStep = 0,
  onStepChange,
}) => {
  const theme = useTheme();
  const [highlightPosition, setHighlightPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [highlightOpacity] = useState(new Animated.Value(0));
  const [tooltipOpacity] = useState(new Animated.Value(0));
  const [tooltipPosition] = useState(new Animated.Value(0));

  useEffect(() => {
    if (isVisible) {
      // Find the target element and calculate its position
      const targetElement = document.querySelector(steps[currentStep].target);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setHighlightPosition({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        });

        // Animate the highlight and tooltip
        Animated.parallel([
          Animated.timing(highlightOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(tooltipOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  }, [isVisible, currentStep, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      onStepChange?.(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      onStepChange?.(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const renderTooltip = () => {
    const step = steps[currentStep];
    const { position, offset = 20 } = step;

    const tooltipStyle = {
      ...styles.tooltip,
      ...getTooltipPosition(position, offset),
    };

    return (
      <Animated.View
        style={[
          tooltipStyle,
          {
            opacity: tooltipOpacity,
            transform: [{ translateY: tooltipPosition }],
          },
        ]}
      >
        <View style={styles.tooltipHeader}>
          <Text style={styles.tooltipTitle}>{step.title}</Text>
          <TouchableOpacity onPress={handleSkip} style={styles.closeButton}>
            <Icon name="close" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <Text style={styles.tooltipDescription}>{step.description}</Text>
        <View style={styles.tooltipFooter}>
          <Text style={styles.stepIndicator}>
            Step {currentStep + 1} of {steps.length}
          </Text>
          <View style={styles.tooltipButtons}>
            {currentStep > 0 && (
              <Button
                title="Previous"
                variant="secondary"
                onPress={handlePrevious}
                style={styles.tooltipButton}
              />
            )}
            <Button
              title={currentStep < steps.length - 1 ? 'Next' : 'Finish'}
              variant="primary"
              onPress={handleNext}
              style={styles.tooltipButton}
            />
          </View>
        </View>
      </Animated.View>
    );
  };

  const getTooltipPosition = (position: string, offset: number) => {
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    const tooltipWidth = 300; // Approximate tooltip width
    const tooltipHeight = 200; // Approximate tooltip height

    switch (position) {
      case 'top':
        return {
          top: highlightPosition.y - tooltipHeight - offset,
          left: Math.min(
            highlightPosition.x + highlightPosition.width / 2 - tooltipWidth / 2,
            screenWidth - tooltipWidth - 20
          ),
        };
      case 'bottom':
        return {
          top: highlightPosition.y + highlightPosition.height + offset,
          left: Math.min(
            highlightPosition.x + highlightPosition.width / 2 - tooltipWidth / 2,
            screenWidth - tooltipWidth - 20
          ),
        };
      case 'left':
        return {
          top: highlightPosition.y + highlightPosition.height / 2 - tooltipHeight / 2,
          left: highlightPosition.x - tooltipWidth - offset,
        };
      case 'right':
        return {
          top: highlightPosition.y + highlightPosition.height / 2 - tooltipHeight / 2,
          left: highlightPosition.x + highlightPosition.width + offset,
        };
      default:
        return {};
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.highlight,
            {
              opacity: highlightOpacity,
              left: highlightPosition.x,
              top: highlightPosition.y,
              width: highlightPosition.width,
              height: highlightPosition.height,
            },
          ]}
        />
        {renderTooltip()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  highlight: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 4,
  },
  tooltip: {
    position: 'absolute',
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  tooltipDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  tooltipFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepIndicator: {
    fontSize: 14,
    color: '#666',
  },
  tooltipButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  tooltipButton: {
    minWidth: 80,
  },
}); 