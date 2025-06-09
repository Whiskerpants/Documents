import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  enableIndexedDbPersistence,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import {
  Pasture,
  WaterSource,
  GrazingEvent,
  ForageMeasurement,
  SoilSample,
  GrazingPlan,
  WeatherData,
  CarbonSequestration,
  SoilHealthScore,
  EconomicImpact,
  PastureStatus,
  WeatherCondition
} from '../../store/types/grazing';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
const COLLECTIONS = {
  PASTURES: 'pastures',
  WATER_SOURCES: 'waterSources',
  GRAZING_EVENTS: 'grazingEvents',
  FORAGE_MEASUREMENTS: 'forageMeasurements',
  SOIL_SAMPLES: 'soilSamples',
  GRAZING_PLANS: 'grazingPlans',
  WEATHER_DATA: 'weatherData',
  CARBON_SEQUESTRATION: 'carbonSequestration',
  SOIL_HEALTH_SCORES: 'soilHealthScores',
  ECONOMIC_IMPACTS: 'economicImpacts'
};

const OFFLINE_QUEUE_KEY = 'grazing_offline_queue';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Helper Functions
const convertTimestamp = (timestamp: Timestamp): Date => timestamp.toDate();
const convertToTimestamp = (date: Date): Timestamp => Timestamp.fromDate(date);

const convertFirestoreData = <T extends { createdAt: Date; updatedAt: Date }>(
  data: any
): T => ({
  ...data,
  createdAt: convertTimestamp(data.createdAt),
  updatedAt: convertTimestamp(data.updatedAt)
});

const validatePasture = (pasture: Partial<Pasture>): string[] => {
  const errors: string[] = [];
  if (!pasture.name) errors.push('Name is required');
  if (!pasture.boundaries?.length) errors.push('Boundaries are required');
  if (!pasture.area) errors.push('Area is required');
  if (!pasture.soilTypes?.length) errors.push('Soil types are required');
  if (!pasture.vegetationTypes?.length) errors.push('Vegetation types are required');
  return errors;
};

// Offline Support
class OfflineQueue {
  private queue: Array<{
    action: string;
    collection: string;
    data: any;
    timestamp: number;
  }> = [];

  async addToQueue(action: string, collection: string, data: any) {
    this.queue.push({
      action,
      collection,
      data,
      timestamp: Date.now()
    });
    await this.saveQueue();
  }

  async saveQueue() {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  async loadQueue() {
    try {
      const queue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (queue) {
        this.queue = JSON.parse(queue);
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
    }
  }

  async processQueue() {
    const batch = writeBatch(db);
    for (const item of this.queue) {
      try {
        switch (item.action) {
          case 'create':
            await addDoc(collection(db, item.collection), item.data);
            break;
          case 'update':
            await updateDoc(doc(db, item.collection, item.data.id), item.data);
            break;
          case 'delete':
            await deleteDoc(doc(db, item.collection, item.data.id));
            break;
        }
      } catch (error) {
        console.error(`Error processing queue item:`, error);
      }
    }
    this.queue = [];
    await this.saveQueue();
  }
}

const offlineQueue = new OfflineQueue();

// Initialize offline support
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support persistence.');
  }
});

// Network status monitoring
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    offlineQueue.processQueue();
  }
});

// Pasture Operations
export const getPastures = async (): Promise<Pasture[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.PASTURES));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFirestoreData(doc.data())
    })) as Pasture[];
  } catch (error) {
    console.error('Error fetching pastures:', error);
    throw error;
  }
};

export const getPastureById = async (id: string): Promise<Pasture | null> => {
  try {
    const docRef = doc(db, COLLECTIONS.PASTURES, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...convertFirestoreData(docSnap.data())
      } as Pasture;
    }
    return null;
  } catch (error) {
    console.error('Error fetching pasture:', error);
    throw error;
  }
};

export const createPasture = async (pasture: Omit<Pasture, 'id'>): Promise<Pasture> => {
  const errors = validatePasture(pasture);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  const pastureData = {
    ...pasture,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    const isConnected = (await NetInfo.fetch()).isConnected;
    if (!isConnected) {
      await offlineQueue.addToQueue('create', COLLECTIONS.PASTURES, pastureData);
      return pasture as Pasture;
    }

    const docRef = await addDoc(collection(db, COLLECTIONS.PASTURES), pastureData);
    return {
      id: docRef.id,
      ...pasture
    } as Pasture;
  } catch (error) {
    console.error('Error creating pasture:', error);
    throw error;
  }
};

export const updatePasture = async (id: string, pasture: Partial<Pasture>): Promise<void> => {
  const errors = validatePasture(pasture);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  const updateData = {
    ...pasture,
    updatedAt: serverTimestamp()
  };

  try {
    const isConnected = (await NetInfo.fetch()).isConnected;
    if (!isConnected) {
      await offlineQueue.addToQueue('update', COLLECTIONS.PASTURES, { id, ...updateData });
      return;
    }

    await updateDoc(doc(db, COLLECTIONS.PASTURES, id), updateData);
  } catch (error) {
    console.error('Error updating pasture:', error);
    throw error;
  }
};

export const deletePasture = async (id: string): Promise<void> => {
  try {
    const isConnected = (await NetInfo.fetch()).isConnected;
    if (!isConnected) {
      await offlineQueue.addToQueue('delete', COLLECTIONS.PASTURES, { id });
      return;
    }

    await deleteDoc(doc(db, COLLECTIONS.PASTURES, id));
  } catch (error) {
    console.error('Error deleting pasture:', error);
    throw error;
  }
};

// Weather Data Integration
export const fetchWeatherData = async (location: { latitude: number; longitude: number }): Promise<WeatherData> => {
  try {
    const response = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY}&q=${location.latitude},${location.longitude}&days=1`
    );
    const data = await response.json();

    const weatherData: WeatherData = {
      id: Date.now().toString(),
      date: new Date(),
      location,
      conditions: [data.current.condition.text.toLowerCase() as WeatherCondition],
      temperature: {
        min: data.forecast.forecastday[0].day.mintemp_c,
        max: data.forecast.forecastday[0].day.maxtemp_c,
        current: data.current.temp_c
      },
      precipitation: data.forecast.forecastday[0].day.totalprecip_mm,
      humidity: data.current.humidity,
      windSpeed: data.current.wind_kph,
      windDirection: data.current.wind_degree,
      solarRadiation: data.current.uv,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await addDoc(collection(db, COLLECTIONS.WEATHER_DATA), weatherData);
    return weatherData;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
};

// Image Upload
export const uploadPastureImage = async (pastureId: string, imageUri: string): Promise<string> => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const filename = `pastures/${pastureId}/${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    
    await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(storageRef);
    
    await updateDoc(doc(db, COLLECTIONS.PASTURES, pastureId), {
      imageUrl: downloadUrl,
      updatedAt: serverTimestamp()
    });
    
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading pasture image:', error);
    throw error;
  }
};

// Soil Health Score Calculation
export const calculateSoilHealthScore = async (soilSample: SoilSample): Promise<SoilHealthScore> => {
  const { metrics } = soilSample;
  
  // Calculate individual component scores (0-100)
  const organicMatterScore = Math.min(100, (metrics.organicMatter / 5) * 100);
  const biologicalActivityScore = Math.min(100, (metrics.nitrogen / 2000) * 100);
  const waterInfiltrationScore = Math.min(100, (metrics.waterHoldingCapacity / 50) * 100);
  const aggregateStabilityScore = Math.min(100, (metrics.bulkDensity / 1.5) * 100);
  const nutrientCyclingScore = Math.min(100, ((metrics.nitrogen + metrics.phosphorus + metrics.potassium) / 3000) * 100);

  // Calculate overall score
  const overallScore = Math.round(
    (organicMatterScore * 0.3 +
      biologicalActivityScore * 0.2 +
      waterInfiltrationScore * 0.2 +
      aggregateStabilityScore * 0.15 +
      nutrientCyclingScore * 0.15)
  );

  const soilHealthScore: SoilHealthScore = {
    id: Date.now().toString(),
    pastureId: soilSample.pastureId,
    date: new Date(),
    score: overallScore,
    components: {
      organicMatter: organicMatterScore,
      biologicalActivity: biologicalActivityScore,
      waterInfiltration: waterInfiltrationScore,
      aggregateStability: aggregateStabilityScore,
      nutrientCycling: nutrientCyclingScore
    },
    recommendations: generateRecommendations(overallScore, {
      organicMatter: organicMatterScore,
      biologicalActivity: biologicalActivityScore,
      waterInfiltration: waterInfiltrationScore,
      aggregateStability: aggregateStabilityScore,
      nutrientCycling: nutrientCyclingScore
    }),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await addDoc(collection(db, COLLECTIONS.SOIL_HEALTH_SCORES), soilHealthScore);
  return soilHealthScore;
};

// Carbon Sequestration Estimation
export const estimateCarbonSequestration = async (
  pastureId: string,
  soilSample: SoilSample,
  grazingEvents: GrazingEvent[]
): Promise<CarbonSequestration> => {
  // Calculate above-ground biomass based on grazing events
  const totalGrazingDays = grazingEvents.reduce((sum, event) => {
    const days = (event.endDate ? event.endDate.getTime() : Date.now()) - event.startDate.getTime();
    return sum + days / (1000 * 60 * 60 * 24);
  }, 0);

  const aboveGroundBiomass = calculateAboveGroundBiomass(totalGrazingDays, soilSample.metrics);
  const belowGroundBiomass = calculateBelowGroundBiomass(aboveGroundBiomass);
  const soilOrganicCarbon = calculateSoilOrganicCarbon(soilSample.metrics);

  const carbonSequestration: CarbonSequestration = {
    id: Date.now().toString(),
    pastureId,
    date: new Date(),
    metrics: {
      aboveGroundBiomass,
      belowGroundBiomass,
      soilOrganicCarbon,
      totalSequestration: aboveGroundBiomass + belowGroundBiomass + soilOrganicCarbon
    },
    methodology: 'IPCC Tier 1',
    verificationStatus: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await addDoc(collection(db, COLLECTIONS.CARBON_SEQUESTRATION), carbonSequestration);
  return carbonSequestration;
};

// Helper functions for calculations
const calculateAboveGroundBiomass = (grazingDays: number, metrics: SoilSample['metrics']): number => {
  // Simplified calculation based on grazing days and soil metrics
  const baseBiomass = 2.5; // tons/ha/year
  const soilQualityFactor = (metrics.organicMatter + metrics.nitrogen / 1000) / 2;
  return baseBiomass * soilQualityFactor * (1 - grazingDays / 365);
};

const calculateBelowGroundBiomass = (aboveGroundBiomass: number): number => {
  // Typically 2-3 times above-ground biomass
  return aboveGroundBiomass * 2.5;
};

const calculateSoilOrganicCarbon = (metrics: SoilSample['metrics']): number => {
  // Convert organic matter to carbon (typically 58% of organic matter)
  return metrics.organicMatter * 0.58;
};

const generateRecommendations = (
  overallScore: number,
  components: SoilHealthScore['components']
): string[] => {
  const recommendations: string[] = [];

  if (overallScore < 50) {
    recommendations.push('Consider implementing a comprehensive soil health improvement plan');
  }

  if (components.organicMatter < 50) {
    recommendations.push('Increase organic matter through cover cropping and reduced tillage');
  }

  if (components.biologicalActivity < 50) {
    recommendations.push('Enhance biological activity by reducing chemical inputs and increasing organic amendments');
  }

  if (components.waterInfiltration < 50) {
    recommendations.push('Improve water infiltration through better soil structure management');
  }

  if (components.aggregateStability < 50) {
    recommendations.push('Work on improving soil structure and reducing compaction');
  }

  if (components.nutrientCycling < 50) {
    recommendations.push('Optimize nutrient cycling through better grazing management and diverse plant species');
  }

  return recommendations;
};

// Export all functions
export default {
  // Pasture operations
  getPastures,
  getPastureById,
  createPasture,
  updatePasture,
  deletePasture,

  // Weather and image operations
  fetchWeatherData,
  uploadPastureImage,

  // Analysis operations
  calculateSoilHealthScore,
  estimateCarbonSequestration
}; 