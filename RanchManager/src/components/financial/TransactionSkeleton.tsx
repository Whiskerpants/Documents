import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface TransactionSkeletonProps {
  count?: number;
}

export const TransactionSkeleton: React.FC<TransactionSkeletonProps> = ({ count = 5 }) => {
  const { colors } = useTheme();
  const animatedValue = new Animated.Value(0);

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.skeleton,
            {
              backgroundColor: colors.card,
              opacity,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.categoryContainer}>
              <View style={[styles.icon, { backgroundColor: colors.border }]} />
              <View style={[styles.category, { backgroundColor: colors.border }]} />
            </View>
            <View style={[styles.amount, { backgroundColor: colors.border }]} />
          </View>

          <View style={[styles.description, { backgroundColor: colors.border }]} />

          <View style={styles.footer}>
            <View style={[styles.date, { backgroundColor: colors.border }]} />
            <View style={[styles.entity, { backgroundColor: colors.border }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  skeleton: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  category: {
    width: 100,
    height: 16,
    borderRadius: 4,
    marginLeft: 8,
  },
  amount: {
    width: 80,
    height: 18,
    borderRadius: 4,
  },
  description: {
    width: '80%',
    height: 14,
    borderRadius: 4,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    width: 80,
    height: 12,
    borderRadius: 4,
  },
  entity: {
    width: 60,
    height: 12,
    borderRadius: 4,
  },
}); 