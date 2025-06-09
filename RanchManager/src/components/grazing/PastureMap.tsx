import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Platform,
  Alert
} from 'react-native';
import MapView, {
  Polygon,
  Marker,
  PROVIDER_GOOGLE,
  Region,
  MapEvent
} from 'react-native-maps';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  Pasture,
  WaterSource,
  PastureStatus,
  SoilType,
  VegetationType
} from '../../store/types/grazing';
import { setSelectedPasture } from '../../store/reducers/grazingReducer';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
interface PastureMapProps {
  mode: 'view' | 'edit';
  onPastureSelect?: (pasture: Pasture) => void;
  onWaterSourceSelect?: (waterSource: WaterSource) => void;
  onBoundaryUpdate?: (pastureId: string, newBoundaries: Array<{ latitude: number; longitude: number }>) => void;
}

interface LayerState {
  satellite: boolean;
  soilType: boolean;
  vegetationHealth: boolean;
  weather: boolean;
  cattleHistory: boolean;
}

// Constants
const MAP_CACHE_KEY = 'pasture_map_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Helper Functions
const getPastureColor = (status: PastureStatus): string => {
  switch (status) {
    case 'active':
      return 'rgba(0, 255, 0, 0.3)';
    case 'resting':
      return 'rgba(255, 255, 0, 0.3)';
    case 'recovery':
      return 'rgba(255, 0, 0, 0.3)';
    default:
      return 'rgba(128, 128, 128, 0.3)';
  }
};

const getSoilTypeColor = (soilType: SoilType): string => {
  switch (soilType) {
    case 'clay':
      return 'rgba(139, 69, 19, 0.3)';
    case 'sandy':
      return 'rgba(210, 180, 140, 0.3)';
    case 'loamy':
      return 'rgba(160, 82, 45, 0.3)';
    default:
      return 'rgba(128, 128, 128, 0.3)';
  }
};

const PastureMap: React.FC<PastureMapProps> = ({
  mode,
  onPastureSelect,
  onWaterSourceSelect,
  onBoundaryUpdate
}) => {
  // State
  const [region, setRegion] = useState<Region>({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421
  });
  const [layers, setLayers] = useState<LayerState>({
    satellite: false,
    soilType: false,
    vegetationHealth: false,
    weather: false,
    cattleHistory: false
  });
  const [isOffline, setIsOffline] = useState(false);
  const [editingPasture, setEditingPasture] = useState<string | null>(null);
  const [newBoundaryPoints, setNewBoundaryPoints] = useState<Array<{ latitude: number; longitude: number }>>([]);

  // Refs
  const mapRef = useRef<MapView>(null);
  const lastLocation = useRef<Location.LocationObject | null>(null);

  // Redux
  const dispatch = useDispatch();
  const { pastures, waterSources, selectedPasture } = useSelector((state: RootState) => state.grazing);

  // Effects
  useEffect(() => {
    checkConnectivity();
    requestLocationPermission();
    loadCachedMapData();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
      if (state.isConnected) {
        syncOfflineChanges();
      }
    });

    return () => unsubscribe();
  }, []);

  // Functions
  const checkConnectivity = async () => {
    const netInfo = await NetInfo.fetch();
    setIsOffline(!netInfo.isConnected);
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const location = await Location.getCurrentPositionAsync({});
      lastLocation.current = location;
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421
      });
    }
  };

  const loadCachedMapData = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(MAP_CACHE_KEY);
      if (cachedData) {
        const { timestamp, data } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          // Use cached data
          setRegion(data.region);
        }
      }
    } catch (error) {
      console.error('Error loading cached map data:', error);
    }
  };

  const saveMapCache = async () => {
    try {
      const cacheData = {
        timestamp: Date.now(),
        data: {
          region,
          lastLocation: lastLocation.current
        }
      };
      await AsyncStorage.setItem(MAP_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving map cache:', error);
    }
  };

  const syncOfflineChanges = async () => {
    // Implement offline sync logic here
  };

  const handleMapPress = (event: MapEvent) => {
    if (mode === 'edit' && editingPasture) {
      const { coordinate } = event.nativeEvent;
      setNewBoundaryPoints(prev => [...prev, coordinate]);
    }
  };

  const handleLongPress = (event: MapEvent) => {
    if (mode === 'edit') {
      const { coordinate } = event.nativeEvent;
      setNewBoundaryPoints(prev => [...prev, coordinate]);
    }
  };

  const handlePasturePress = (pasture: Pasture) => {
    if (mode === 'view') {
      dispatch(setSelectedPasture(pasture));
      onPastureSelect?.(pasture);
    }
  };

  const handleWaterSourcePress = (waterSource: WaterSource) => {
    onWaterSourceSelect?.(waterSource);
  };

  const toggleLayer = (layer: keyof LayerState) => {
    setLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  const startEditingPasture = (pastureId: string) => {
    setEditingPasture(pastureId);
    const pasture = pastures.items.find(p => p.id === pastureId);
    if (pasture) {
      setNewBoundaryPoints(pasture.boundaries);
    }
  };

  const finishEditingPasture = () => {
    if (editingPasture && newBoundaryPoints.length >= 3) {
      onBoundaryUpdate?.(editingPasture, newBoundaryPoints);
      setEditingPasture(null);
      setNewBoundaryPoints([]);
    } else {
      Alert.alert('Error', 'A pasture must have at least 3 boundary points');
    }
  };

  const cancelEditing = () => {
    setEditingPasture(null);
    setNewBoundaryPoints([]);
  };

  // Render Functions
  const renderPastures = () => {
    return pastures.items.map(pasture => (
      <Polygon
        key={pasture.id}
        coordinates={pasture.boundaries}
        fillColor={getPastureColor(pasture.status)}
        strokeColor={pasture.id === selectedPasture?.id ? '#000' : '#666'}
        strokeWidth={2}
        tappable
        onPress={() => handlePasturePress(pasture)}
      />
    ));
  };

  const renderWaterSources = () => {
    return waterSources.items.map(source => (
      <Marker
        key={source.id}
        coordinate={source.location}
        onPress={() => handleWaterSourcePress(source)}
      >
        <MaterialIcons name="water" size={24} color="#2196F3" />
      </Marker>
    ));
  };

  const renderEditingControls = () => {
    if (mode !== 'edit') return null;

    return (
      <View style={styles.editingControls}>
        {editingPasture ? (
          <>
            <TouchableOpacity
              style={[styles.controlButton, styles.saveButton]}
              onPress={finishEditingPasture}
            >
              <MaterialIcons name="check" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, styles.cancelButton]}
              onPress={cancelEditing}
            >
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.controlButton, styles.editButton]}
            onPress={() => setEditingPasture('new')}
          >
            <MaterialIcons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderLayerControls = () => {
    return (
      <View style={styles.layerControls}>
        <TouchableOpacity
          style={[styles.layerButton, layers.satellite && styles.activeLayer]}
          onPress={() => toggleLayer('satellite')}
        >
          <MaterialIcons name="satellite" size={24} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.layerButton, layers.soilType && styles.activeLayer]}
          onPress={() => toggleLayer('soilType')}
        >
          <MaterialIcons name="terrain" size={24} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.layerButton, layers.vegetationHealth && styles.activeLayer]}
          onPress={() => toggleLayer('vegetationHealth')}
        >
          <MaterialIcons name="grass" size={24} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.layerButton, layers.weather && styles.activeLayer]}
          onPress={() => toggleLayer('weather')}
        >
          <MaterialIcons name="cloud" size={24} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.layerButton, layers.cattleHistory && styles.activeLayer]}
          onPress={() => toggleLayer('cattleHistory')}
        >
          <MaterialIcons name="timeline" size={24} color="#666" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
        onLongPress={handleLongPress}
        mapType={layers.satellite ? 'satellite' : 'standard'}
        showsUserLocation
        showsMyLocationButton
      >
        {renderPastures()}
        {renderWaterSources()}
        {editingPasture && newBoundaryPoints.length > 0 && (
          <Polygon
            coordinates={newBoundaryPoints}
            fillColor="rgba(0, 0, 255, 0.2)"
            strokeColor="#0000FF"
            strokeWidth={2}
          />
        )}
      </MapView>
      {renderLayerControls()}
      {renderEditingControls()}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Offline Mode</Text>
        </View>
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height
  },
  layerControls: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4
  },
  layerButton: {
    padding: 8,
    marginVertical: 4,
    borderRadius: 4
  },
  activeLayer: {
    backgroundColor: '#e3f2fd'
  },
  editingControls: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row'
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4
  },
  saveButton: {
    backgroundColor: '#4CAF50'
  },
  cancelButton: {
    backgroundColor: '#F44336'
  },
  editButton: {
    backgroundColor: '#2196F3'
  },
  offlineBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F44336',
    padding: 8,
    alignItems: 'center'
  },
  offlineText: {
    color: '#fff',
    fontWeight: 'bold'
  }
});

export default PastureMap; 