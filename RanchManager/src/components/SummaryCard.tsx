import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SummaryCardProps {
  title: string;
  value: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  style?: object;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, style }) => {
  return (
    <View style={[styles.container, style]}>
      <MaterialCommunityIcons name={icon} size={24} color="#666" />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  title: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
}); 