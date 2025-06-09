import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WeatherData } from '../types/weather';

interface WeatherInfoProps {
  data: WeatherData;
  style?: object;
}

export const WeatherInfo: React.FC<WeatherInfoProps> = ({ data, style }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="weather-partly-cloudy" size={32} color="#666" />
        <Text style={styles.temperature}>{data.temperature}°C</Text>
      </View>
      <Text style={styles.condition}>{data.condition}</Text>
      <View style={styles.details}>
        <View style={styles.detail}>
          <MaterialCommunityIcons name="water-percent" size={20} color="#666" />
          <Text style={styles.detailText}>{data.humidity}%</Text>
        </View>
        <View style={styles.detail}>
          <MaterialCommunityIcons name="weather-windy" size={20} color="#666" />
          <Text style={styles.detailText}>{data.windSpeed} km/h</Text>
        </View>
        <View style={styles.detail}>
          <MaterialCommunityIcons name="umbrella" size={20} color="#666" />
          <Text style={styles.detailText}>{data.precipitation} mm</Text>
        </View>
        <View style={styles.detail}>
          <MaterialCommunityIcons name="white-balance-sunny" size={20} color="#666" />
          <Text style={styles.detailText}>UV {data.uvIndex}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  temperature: {
    fontSize: 32,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  condition: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detail: {
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
}); 