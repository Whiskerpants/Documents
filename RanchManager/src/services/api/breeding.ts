import { firestore } from '../firebase';
import {
  Breeding,
  Pregnancy,
  Birth,
  LineageRecord,
  GeneticProfile,
  BreedingFilters,
  PregnancyFilters,
  CreateBreedingInput,
  UpdateBreedingInput,
  CreatePregnancyInput,
  UpdatePregnancyInput,
  CreateBirthInput,
  UpdateBirthInput,
  BreedingStatus,
  PregnancyStatus,
  PregnancyOutcome,
} from '../../store/types/breeding';

// Helper function to convert Firestore Timestamp to Date
const convertTimestamp = (timestamp: any) => {
  return timestamp?.toDate() || new Date();
};

// Breeding API Functions
export const fetchBreedings = async (filters?: BreedingFilters): Promise<Breeding[]> => {
  try {
    let query = firestore.collection('breedings');

    if (filters) {
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }
      if (filters.damId) {
        query = query.where('damId', '==', filters.damId);
      }
      if (filters.sireId) {
        query = query.where('sireId', '==', filters.sireId);
      }
      if (filters.startDate) {
        query = query.where('breedingDate', '>=', filters.startDate);
      }
      if (filters.endDate) {
        query = query.where('breedingDate', '<=', filters.endDate);
      }
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      breedingDate: convertTimestamp(doc.data().breedingDate),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt),
    })) as Breeding[];
  } catch (error) {
    console.error('Error fetching breedings:', error);
    throw error;
  }
};

export const createBreeding = async (breeding: CreateBreedingInput): Promise<Breeding> => {
  try {
    const docRef = await firestore.collection('breedings').add({
      ...breeding,
      status: BreedingStatus.Pending,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const doc = await docRef.get();
    return {
      id: doc.id,
      ...doc.data(),
      breedingDate: convertTimestamp(doc.data()?.breedingDate),
      createdAt: convertTimestamp(doc.data()?.createdAt),
      updatedAt: convertTimestamp(doc.data()?.updatedAt),
    } as Breeding;
  } catch (error) {
    console.error('Error creating breeding:', error);
    throw error;
  }
};

export const updateBreeding = async (id: string, updates: UpdateBreedingInput): Promise<Breeding> => {
  try {
    const docRef = firestore.collection('breedings').doc(id);
    await docRef.update({
      ...updates,
      updatedAt: new Date(),
    });

    const doc = await docRef.get();
    return {
      id: doc.id,
      ...doc.data(),
      breedingDate: convertTimestamp(doc.data()?.breedingDate),
      createdAt: convertTimestamp(doc.data()?.createdAt),
      updatedAt: convertTimestamp(doc.data()?.updatedAt),
    } as Breeding;
  } catch (error) {
    console.error('Error updating breeding:', error);
    throw error;
  }
};

export const deleteBreeding = async (id: string): Promise<void> => {
  try {
    await firestore.collection('breedings').doc(id).delete();
  } catch (error) {
    console.error('Error deleting breeding:', error);
    throw error;
  }
};

// Pregnancy API Functions
export const fetchPregnancies = async (filters?: PregnancyFilters): Promise<Pregnancy[]> => {
  try {
    let query = firestore.collection('pregnancies');

    if (filters) {
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }
      if (filters.damId) {
        query = query.where('damId', '==', filters.damId);
      }
      if (filters.startDate) {
        query = query.where('expectedDueDate', '>=', filters.startDate);
      }
      if (filters.endDate) {
        query = query.where('expectedDueDate', '<=', filters.endDate);
      }
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      confirmationDate: convertTimestamp(doc.data().confirmationDate),
      expectedDueDate: convertTimestamp(doc.data().expectedDueDate),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt),
      pregnancyChecks: doc.data().pregnancyChecks?.map((check: any) => ({
        ...check,
        date: convertTimestamp(check.date),
      })),
    })) as Pregnancy[];
  } catch (error) {
    console.error('Error fetching pregnancies:', error);
    throw error;
  }
};

export const createPregnancy = async (pregnancy: CreatePregnancyInput): Promise<Pregnancy> => {
  try {
    const docRef = await firestore.collection('pregnancies').add({
      ...pregnancy,
      status: PregnancyStatus.Confirmed,
      pregnancyChecks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const doc = await docRef.get();
    return {
      id: doc.id,
      ...doc.data(),
      confirmationDate: convertTimestamp(doc.data()?.confirmationDate),
      expectedDueDate: convertTimestamp(doc.data()?.expectedDueDate),
      createdAt: convertTimestamp(doc.data()?.createdAt),
      updatedAt: convertTimestamp(doc.data()?.updatedAt),
      pregnancyChecks: [],
    } as Pregnancy;
  } catch (error) {
    console.error('Error creating pregnancy:', error);
    throw error;
  }
};

export const updatePregnancy = async (id: string, updates: UpdatePregnancyInput): Promise<Pregnancy> => {
  try {
    const docRef = firestore.collection('pregnancies').doc(id);
    await docRef.update({
      ...updates,
      updatedAt: new Date(),
    });

    const doc = await docRef.get();
    return {
      id: doc.id,
      ...doc.data(),
      confirmationDate: convertTimestamp(doc.data()?.confirmationDate),
      expectedDueDate: convertTimestamp(doc.data()?.expectedDueDate),
      createdAt: convertTimestamp(doc.data()?.createdAt),
      updatedAt: convertTimestamp(doc.data()?.updatedAt),
      pregnancyChecks: doc.data()?.pregnancyChecks?.map((check: any) => ({
        ...check,
        date: convertTimestamp(check.date),
      })),
    } as Pregnancy;
  } catch (error) {
    console.error('Error updating pregnancy:', error);
    throw error;
  }
};

export const deletePregnancy = async (id: string): Promise<void> => {
  try {
    await firestore.collection('pregnancies').doc(id).delete();
  } catch (error) {
    console.error('Error deleting pregnancy:', error);
    throw error;
  }
};

// Birth API Functions
export const fetchBirths = async (): Promise<Birth[]> => {
  try {
    const snapshot = await firestore.collection('births').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      birthDate: convertTimestamp(doc.data().birthDate),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt),
    })) as Birth[];
  } catch (error) {
    console.error('Error fetching births:', error);
    throw error;
  }
};

export const createBirth = async (birth: CreateBirthInput): Promise<Birth> => {
  try {
    const docRef = await firestore.collection('births').add({
      ...birth,
      outcome: birth.outcome || PregnancyOutcome.LiveBirth,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const doc = await docRef.get();
    return {
      id: doc.id,
      ...doc.data(),
      birthDate: convertTimestamp(doc.data()?.birthDate),
      createdAt: convertTimestamp(doc.data()?.createdAt),
      updatedAt: convertTimestamp(doc.data()?.updatedAt),
    } as Birth;
  } catch (error) {
    console.error('Error creating birth:', error);
    throw error;
  }
};

export const updateBirth = async (id: string, updates: UpdateBirthInput): Promise<Birth> => {
  try {
    const docRef = firestore.collection('births').doc(id);
    await docRef.update({
      ...updates,
      updatedAt: new Date(),
    });

    const doc = await docRef.get();
    return {
      id: doc.id,
      ...doc.data(),
      birthDate: convertTimestamp(doc.data()?.birthDate),
      createdAt: convertTimestamp(doc.data()?.createdAt),
      updatedAt: convertTimestamp(doc.data()?.updatedAt),
    } as Birth;
  } catch (error) {
    console.error('Error updating birth:', error);
    throw error;
  }
};

export const deleteBirth = async (id: string): Promise<void> => {
  try {
    await firestore.collection('births').doc(id).delete();
  } catch (error) {
    console.error('Error deleting birth:', error);
    throw error;
  }
};

// Lineage API Functions
export const fetchLineageRecords = async (): Promise<LineageRecord[]> => {
  try {
    const snapshot = await firestore.collection('lineageRecords').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt),
    })) as LineageRecord[];
  } catch (error) {
    console.error('Error fetching lineage records:', error);
    throw error;
  }
};

export const createLineageRecord = async (record: LineageRecord): Promise<LineageRecord> => {
  try {
    const docRef = await firestore.collection('lineageRecords').add({
      ...record,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const doc = await docRef.get();
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data()?.createdAt),
      updatedAt: convertTimestamp(doc.data()?.updatedAt),
    } as LineageRecord;
  } catch (error) {
    console.error('Error creating lineage record:', error);
    throw error;
  }
};

export const updateLineageRecord = async (id: string, record: LineageRecord): Promise<LineageRecord> => {
  try {
    const docRef = firestore.collection('lineageRecords').doc(id);
    await docRef.update({
      ...record,
      updatedAt: new Date(),
    });

    const doc = await docRef.get();
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data()?.createdAt),
      updatedAt: convertTimestamp(doc.data()?.updatedAt),
    } as LineageRecord;
  } catch (error) {
    console.error('Error updating lineage record:', error);
    throw error;
  }
};

// Genetic Profile API Functions
export const fetchGeneticProfiles = async (): Promise<GeneticProfile[]> => {
  try {
    const snapshot = await firestore.collection('geneticProfiles').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt),
    })) as GeneticProfile[];
  } catch (error) {
    console.error('Error fetching genetic profiles:', error);
    throw error;
  }
};

export const createGeneticProfile = async (profile: GeneticProfile): Promise<GeneticProfile> => {
  try {
    const docRef = await firestore.collection('geneticProfiles').add({
      ...profile,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const doc = await docRef.get();
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data()?.createdAt),
      updatedAt: convertTimestamp(doc.data()?.updatedAt),
    } as GeneticProfile;
  } catch (error) {
    console.error('Error creating genetic profile:', error);
    throw error;
  }
};

export const updateGeneticProfile = async (id: string, profile: GeneticProfile): Promise<GeneticProfile> => {
  try {
    const docRef = firestore.collection('geneticProfiles').doc(id);
    await docRef.update({
      ...profile,
      updatedAt: new Date(),
    });

    const doc = await docRef.get();
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data()?.createdAt),
      updatedAt: convertTimestamp(doc.data()?.updatedAt),
    } as GeneticProfile;
  } catch (error) {
    console.error('Error updating genetic profile:', error);
    throw error;
  }
}; 