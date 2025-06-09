import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { RouteProp } from '@react-navigation/native';
import { GrazingStackParamList } from '../../navigation/GrazingNavigator';

type PastureDetailRouteProp = RouteProp<GrazingStackParamList, 'PastureDetail'>;

interface Props {
  route: PastureDetailRouteProp;
}

const PastureDetail = ({ route }: Props) => {
  const { pastureId } = route.params;

  return (
    <View style={styles.container}>
      <Text>Pasture Detail Screen</Text>
      <Text>Pasture ID: {pastureId}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});

export default PastureDetail; 