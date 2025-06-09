import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { HealthRecord, HealthFilters, CreateHealthRecordInput, UpdateHealthRecordInput } from '../../store/types/health';

interface FileWithUri {
  uri: string;
  name: string;
}

export const fetchHealthRecords = async (filters?: HealthFilters): Promise<HealthRecord[]> => {
  try {
    let query: FirebaseFirestoreTypes.Query = firestore().collection('healthRecords');

    // Apply filters
    if (filters) {
      if (filters.startDate) {
        query = query.where('date', '>=', filters.startDate);
      }
      if (filters.endDate) {
        query = query.where('date', '<=', filters.endDate);
      }
      if (filters.types?.length) {
        query = query.where('type', 'in', filters.types);
      }
      if (filters.severities?.length) {
        query = query.where('severity', 'in', filters.severities);
      }
      if (filters.resolved !== undefined) {
        query = query.where('resolved', '==', filters.resolved);
      }
    }

    // Order by date descending
    query = query.orderBy('date', 'desc');

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      resolvedAt: doc.data().resolvedAt?.toDate(),
    })) as HealthRecord[];
  } catch (error) {
    console.error('Error fetching health records:', error);
    throw new Error('Failed to fetch health records');
  }
};

export const createHealthRecord = async (record: CreateHealthRecordInput): Promise<HealthRecord> => {
  try {
    // Upload attachments if any
    const attachmentUrls = await Promise.all(
      (record.attachments || []).map(async (file: FileWithUri) => {
        const ref = storage().ref(`health-records/${Date.now()}-${file.name}`);
        await ref.putFile(file.uri);
        return ref.getDownloadURL();
      })
    );

    const newRecord = {
      ...record,
      attachments: attachmentUrls,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await firestore().collection('healthRecords').add(newRecord);
    const doc = await docRef.get();

    return {
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      resolvedAt: doc.data().resolvedAt?.toDate(),
    } as HealthRecord;
  } catch (error) {
    console.error('Error creating health record:', error);
    throw new Error('Failed to create health record');
  }
};

export const updateHealthRecord = async (
  id: string,
  updates: UpdateHealthRecordInput
): Promise<HealthRecord> => {
  try {
    const recordRef = firestore().collection('healthRecords').doc(id);
    const record = await recordRef.get();

    if (!record.exists) {
      throw new Error('Health record not found');
    }

    // Handle attachments
    let attachmentUrls = record.data()?.attachments || [];
    
    // Remove deleted attachments
    if (updates.removedAttachments?.length) {
      attachmentUrls = attachmentUrls.filter(url => !updates.removedAttachments?.includes(url));
      // Delete files from storage
      await Promise.all(
        updates.removedAttachments.map(url => storage().refFromURL(url).delete())
      );
    }

    // Upload new attachments
    if (updates.attachments?.length) {
      const newUrls = await Promise.all(
        updates.attachments.map(async (file: FileWithUri) => {
          const ref = storage().ref(`health-records/${Date.now()}-${file.name}`);
          await ref.putFile(file.uri);
          return ref.getDownloadURL();
        })
      );
      attachmentUrls = [...attachmentUrls, ...newUrls];
    }

    const updateData = {
      ...updates,
      attachments: attachmentUrls,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    await recordRef.update(updateData);
    const updatedDoc = await recordRef.get();

    return {
      id: updatedDoc.id,
      ...updatedDoc.data(),
      date: updatedDoc.data().date.toDate(),
      createdAt: updatedDoc.data().createdAt.toDate(),
      updatedAt: updatedDoc.data().updatedAt.toDate(),
      resolvedAt: updatedDoc.data().resolvedAt?.toDate(),
    } as HealthRecord;
  } catch (error) {
    console.error('Error updating health record:', error);
    throw new Error('Failed to update health record');
  }
};

export const deleteHealthRecord = async (id: string): Promise<void> => {
  try {
    const recordRef = firestore().collection('healthRecords').doc(id);
    const record = await recordRef.get();

    if (!record.exists) {
      throw new Error('Health record not found');
    }

    // Delete attachments from storage
    const attachments = record.data()?.attachments || [];
    await Promise.all(
      attachments.map(url => storage().refFromURL(url).delete())
    );

    // Delete the record
    await recordRef.delete();
  } catch (error) {
    console.error('Error deleting health record:', error);
    throw new Error('Failed to delete health record');
  }
}; 