import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import {
  Pasture,
  GrazingPlan,
  GrazingFilters,
  CreatePastureInput,
  UpdatePastureInput,
  CreateGrazingPlanInput,
  UpdateGrazingPlanInput,
  PastureStatus,
} from '../../store/types/grazing';

// Helper function to convert Firestore timestamps to Dates
const convertTimestamps = (data: any) => {
  const result = { ...data };
  for (const key in result) {
    if (result[key] instanceof FirebaseFirestoreTypes.Timestamp) {
      result[key] = result[key].toDate();
    } else if (Array.isArray(result[key])) {
      result[key] = result[key].map((item: any) => {
        if (item instanceof FirebaseFirestoreTypes.Timestamp) {
          return item.toDate();
        }
        return item;
      });
    }
  }
  return result;
};

// Pasture API Functions
export const fetchPastures = async (filters?: GrazingFilters): Promise<Pasture[]> => {
  try {
    let query: FirebaseFirestoreTypes.Query = firestore().collection('pastures');

    if (filters) {
      if (filters.status?.length) {
        query = query.where('status', 'in', filters.status);
      }
      if (filters.minSize !== undefined) {
        query = query.where('size', '>=', filters.minSize);
      }
      if (filters.maxSize !== undefined) {
        query = query.where('size', '<=', filters.maxSize);
      }
      if (filters.forageTypes?.length) {
        query = query.where('forageTypes', 'array-contains-any', filters.forageTypes);
      }
      if (filters.available) {
        query = query.where('status', '==', PastureStatus.Available);
      }
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as Pasture[];
  } catch (error) {
    console.error('Error fetching pastures:', error);
    throw new Error('Failed to fetch pastures');
  }
};

export const createPasture = async (pasture: CreatePastureInput): Promise<Pasture> => {
  try {
    const newPasture = {
      ...pasture,
      status: PastureStatus.Available,
      grazingHistory: [],
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await firestore().collection('pastures').add(newPasture);
    const doc = await docRef.get();

    return {
      id: doc.id,
      ...convertTimestamps(doc.data()),
    } as Pasture;
  } catch (error) {
    console.error('Error creating pasture:', error);
    throw new Error('Failed to create pasture');
  }
};

export const updatePasture = async (
  id: string,
  updates: UpdatePastureInput
): Promise<Pasture> => {
  try {
    const pastureRef = firestore().collection('pastures').doc(id);
    const pasture = await pastureRef.get();

    if (!pasture.exists) {
      throw new Error('Pasture not found');
    }

    const updateData = {
      ...updates,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    await pastureRef.update(updateData);
    const updatedDoc = await pastureRef.get();

    return {
      id: updatedDoc.id,
      ...convertTimestamps(updatedDoc.data()),
    } as Pasture;
  } catch (error) {
    console.error('Error updating pasture:', error);
    throw new Error('Failed to update pasture');
  }
};

export const deletePasture = async (id: string): Promise<void> => {
  try {
    const pastureRef = firestore().collection('pastures').doc(id);
    const pasture = await pastureRef.get();

    if (!pasture.exists) {
      throw new Error('Pasture not found');
    }

    await pastureRef.delete();
  } catch (error) {
    console.error('Error deleting pasture:', error);
    throw new Error('Failed to delete pasture');
  }
};

// Grazing Plan API Functions
export const fetchGrazingPlans = async (): Promise<GrazingPlan[]> => {
  try {
    const snapshot = await firestore().collection('grazingPlans').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as GrazingPlan[];
  } catch (error) {
    console.error('Error fetching grazing plans:', error);
    throw new Error('Failed to fetch grazing plans');
  }
};

export const createGrazingPlan = async (plan: CreateGrazingPlanInput): Promise<GrazingPlan> => {
  try {
    const newPlan = {
      ...plan,
      status: 'draft',
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await firestore().collection('grazingPlans').add(newPlan);
    const doc = await docRef.get();

    return {
      id: doc.id,
      ...convertTimestamps(doc.data()),
    } as GrazingPlan;
  } catch (error) {
    console.error('Error creating grazing plan:', error);
    throw new Error('Failed to create grazing plan');
  }
};

export const updateGrazingPlan = async (
  id: string,
  updates: UpdateGrazingPlanInput
): Promise<GrazingPlan> => {
  try {
    const planRef = firestore().collection('grazingPlans').doc(id);
    const plan = await planRef.get();

    if (!plan.exists) {
      throw new Error('Grazing plan not found');
    }

    const updateData = {
      ...updates,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    await planRef.update(updateData);
    const updatedDoc = await planRef.get();

    return {
      id: updatedDoc.id,
      ...convertTimestamps(updatedDoc.data()),
    } as GrazingPlan;
  } catch (error) {
    console.error('Error updating grazing plan:', error);
    throw new Error('Failed to update grazing plan');
  }
};

export const deleteGrazingPlan = async (id: string): Promise<void> => {
  try {
    const planRef = firestore().collection('grazingPlans').doc(id);
    const plan = await planRef.get();

    if (!plan.exists) {
      throw new Error('Grazing plan not found');
    }

    await planRef.delete();
  } catch (error) {
    console.error('Error deleting grazing plan:', error);
    throw new Error('Failed to delete grazing plan');
  }
};

// Helper Functions
export const calculateOptimalStockingRate = (
  pastureSize: number,
  forageDensity: number,
  forageQuality: number,
  restPeriod: number
): number => {
  // Basic calculation - can be enhanced with more complex formulas
  const dailyForageProduction = forageDensity * (forageQuality / 10);
  const availableForage = dailyForageProduction * restPeriod;
  const foragePerAnimal = 25; // kg per day per animal
  return Math.floor(availableForage / (foragePerAnimal * restPeriod));
};

export const calculateRecoveryPeriod = (
  forageHeight: number,
  forageDensity: number,
  weatherData: {
    temperature: number;
    precipitation: number;
    humidity: number;
  }
): number => {
  // Basic calculation - can be enhanced with more complex formulas
  const growthRate = forageDensity * (weatherData.precipitation / 100);
  const targetHeight = 30; // cm
  const daysToRecovery = Math.ceil((targetHeight - forageHeight) / growthRate);
  return Math.max(daysToRecovery, 30); // Minimum 30 days rest
}; 