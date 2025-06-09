import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Cattle, CattleDetailScreenProps } from '../../types/cattle';

const CattleDetail: React.FC<CattleDetailScreenProps> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const [cattle, setCattle] = useState<Cattle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Implement actual data fetching from Firebase
    // This is a mock implementation
    setTimeout(() => {
      setCattle({
        id: route.params.cattleId,
        tagNumber: 'TAG123',
        name: 'Bessie',
        breed: 'Angus',
        gender: 'female',
        weight: 650,
        age: 3,
        healthStatus: 'healthy',
        location: 'Pasture A',
        notes: 'Good temperament, excellent milk production',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setLoading(false);
    }, 1000);
  }, [route.params.cattleId]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => navigation.navigate('EditCattle', { cattleId: route.params.cattleId })}
            style={styles.headerButton}
          >
            <Icon name="edit" size={24} color="#3B7302" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                t('cattle.details.deleteConfirmation'),
                '',
                [
                  {
                    text: t('cattle.details.cancel'),
                    style: 'cancel',
                  },
                  {
                    text: t('cattle.details.confirm'),
                    style: 'destructive',
                    onPress: () => {
                      // TODO: Implement delete functionality
                      navigation.goBack();
                    },
                  },
                ],
              );
            }}
            style={styles.headerButton}
          >
            <Icon name="delete" size={24} color="#3B7302" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, route.params.cattleId, t]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B7302" />
        <Text style={styles.loadingText}>{t('cattle.details.loading')}</Text>
      </View>
    );
  }

  if (!cattle) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Cattle not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>{t('cattle.details.tagNumber')}</Text>
        <Text style={styles.value}>{cattle.tagNumber}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t('cattle.details.name')}</Text>
        <Text style={styles.value}>{cattle.name}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t('cattle.details.breed')}</Text>
        <Text style={styles.value}>{cattle.breed}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t('cattle.details.gender')}</Text>
        <Text style={styles.value}>{t(`cattle.details.${cattle.gender}`)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t('cattle.details.weight')}</Text>
        <Text style={styles.value}>{cattle.weight} kg</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t('cattle.details.age')}</Text>
        <Text style={styles.value}>{cattle.age} years</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t('cattle.details.healthStatus')}</Text>
        <Text style={[styles.value, styles[`healthStatus${cattle.healthStatus}`]]}>
          {t(`cattle.details.${cattle.healthStatus}`)}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t('cattle.details.location')}</Text>
        <Text style={styles.value}>{cattle.location}</Text>
      </View>

      {cattle.notes && (
        <View style={styles.section}>
          <Text style={styles.label}>{t('cattle.details.notes')}</Text>
          <Text style={styles.value}>{cattle.notes}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    marginRight: 16,
  },
  headerButton: {
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#3B7302',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  healthStatushealthy: {
    color: '#4CAF50',
  },
  healthStatussick: {
    color: '#F44336',
  },
  healthStatusunderObservation: {
    color: '#FF9800',
  },
});

export default CattleDetail; 