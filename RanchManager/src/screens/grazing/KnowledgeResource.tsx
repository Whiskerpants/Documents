import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const KnowledgeResource = () => {
  return (
    <View style={styles.container}>
      <Text>Knowledge Resource Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});

export default KnowledgeResource; 