import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPastures, fetchGrazingEvents } from '../../store/actions/grazingActions';
import { RootState } from '../../store';
import { Pasture, GrazingEvent, PastureStatus, GrazingEventType, GrazingEventStatus } from '../../store/types/grazing';
import { WeatherData } from '../../types/weather';
import WeatherService from '../../services/WeatherService';
import { SummaryCard } from '../../components/SummaryCard';
import { WeatherInfo } from '../../components/WeatherInfo';
import { PastureMap } from '../../components/PastureMap';
import { GrazingChart } from '../../components/GrazingChart';
import { ActionButton } from '../../components/ActionButton';
import { useNetInfo } from '@react-native-community/netinfo';

export const GrazingDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const netInfo = useNetInfo();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPasture, setSelectedPasture] = useState<Pasture | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  const { pastures, grazingEvents, loading, error } = useSelector((state: RootState) => state.grazing);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(fetchPastures()),
        dispatch(fetchGrazingEvents())
      ]);

      if (pastures.length > 0) {
        const weatherService = WeatherService.getInstance();
        const weather = await weatherService.getCurrentWeather(
          pastures[0].location.latitude,
          pastures[0].location.longitude
        );
        setWeatherData(weather);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderSummaryCards = () => {
    const availablePastures = pastures.filter(p => p.status === 'available' as PastureStatus).length;
    const activeGrazing = grazingEvents.filter(e => e.status === 'in_progress' as GrazingEventStatus).length;
    const plannedRotations = grazingEvents.filter(e => e.type === 'rotation' as GrazingEventType && e.status === 'planned' as GrazingEventStatus).length;

    return (
      <View style={styles.summaryContainer}>
        <SummaryCard
          title="Available Pastures"
          value={availablePastures}
          icon="grass"
        />
        <SummaryCard
          title="Active Grazing"
          value={activeGrazing}
          icon="cow"
        />
        <SummaryCard
          title="Planned Rotations"
          value={plannedRotations}
          icon="calendar"
        />
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {renderSummaryCards()}
      
      {weatherData && (
        <WeatherInfo
          data={weatherData}
          style={styles.weatherContainer}
        />
      )}

      <PastureMap
        pastures={pastures}
        selectedPasture={selectedPasture}
        onPastureSelect={setSelectedPasture}
        style={styles.mapContainer}
      />

      <GrazingChart
        data={grazingEvents}
        style={styles.chartContainer}
      />

      <View style={styles.actionsContainer}>
        <ActionButton
          title="Add Pasture"
          onPress={() => {/* TODO: Implement */}}
          icon="plus"
        />
        <ActionButton
          title="Record Grazing"
          onPress={() => {/* TODO: Implement */}}
          icon="pencil"
        />
        <ActionButton
          title="View History"
          onPress={() => {/* TODO: Implement */}}
          icon="history"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  weatherContainer: {
    margin: 16,
  },
  mapContainer: {
    height: 300,
    margin: 16,
  },
  chartContainer: {
    height: 200,
    margin: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
}); 