import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { Pasture } from '../store/types/grazing';

interface PastureMapProps {
  pastures: Pasture[];
  selectedPasture: Pasture | null;
  onPastureSelect: (pasture: Pasture) => void;
  style?: object;
}

export const PastureMap: React.FC<PastureMapProps> = ({
  pastures,
  selectedPasture,
  onPastureSelect,
  style,
}) => {
  const initialRegion = pastures.length > 0
    ? {
        latitude: pastures[0].location.latitude,
        longitude: pastures[0].location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }
    : undefined;

  return (
    <View style={[styles.container, style]}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
      >
        {pastures.map(pasture => (
          <React.Fragment key={pasture.id}>
            <Marker
              coordinate={pasture.location}
              title={pasture.name}
              description={`Status: ${pasture.status}`}
              onPress={() => onPastureSelect(pasture)}
            />
            <Polygon
              coordinates={pasture.boundaries}
              strokeColor={pasture.id === selectedPasture?.id ? '#FF0000' : '#000000'}
              fillColor={pasture.id === selectedPasture?.id ? 'rgba(255,0,0,0.1)' : 'rgba(0,0,0,0.1)'}
              strokeWidth={2}
            />
          </React.Fragment>
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  map: {
    width: '100%',
    height: '100%',
  },
}); 