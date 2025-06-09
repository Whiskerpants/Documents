import { Budget } from '../../store/types/financial';
import { firestore } from '../firebase/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { mockBudgets } from '../../store/mock/budgetData';

const COLLECTION_NAME = 'budgets';
const USE_MOCK_DATA = process.env.NODE_ENV === 'development';

export const budgetApi = {
  async getAll(filters?: { type?: 'all' | 'active' | 'inactive'; searchQuery?: string }) {
    if (USE_MOCK_DATA) {
      let filteredBudgets = [...mockBudgets];
      
      if (filters?.type && filters.type !== 'all') {
        filteredBudgets = filteredBudgets.filter(budget => 
          filters.type === 'active' ? budget.isActive : !budget.isActive
        );
      }
      
      if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredBudgets = filteredBudgets.filter(budget =>
          budget.name.toLowerCase().includes(query) ||
          budget.description?.toLowerCase().includes(query)
        );
      }
      
      return filteredBudgets;
    }

    const budgetsRef = collection(firestore, COLLECTION_NAME);
    const q = filters?.type && filters.type !== 'all'
      ? query(budgetsRef, where('isActive', '==', filters.type === 'active'))
      : budgetsRef;

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Budget[];
  },

  async getById(id: string) {
    if (USE_MOCK_DATA) {
      const budget = mockBudgets.find(b => b.id === id);
      if (!budget) {
        throw new Error('Budget not found');
      }
      return budget;
    }

    const budgetRef = doc(firestore, COLLECTION_NAME, id);
    const snapshot = await getDoc(budgetRef);
    if (!snapshot.exists()) {
      throw new Error('Budget not found');
    }
    return {
      id: snapshot.id,
      ...snapshot.data()
    } as Budget;
  },

  async create(budget: Omit<Budget, 'id'>) {
    if (USE_MOCK_DATA) {
      const newBudget: Budget = {
        id: `mock-${Date.now()}`,
        ...budget,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockBudgets.push(newBudget);
      return newBudget;
    }

    const budgetsRef = collection(firestore, COLLECTION_NAME);
    const docRef = await addDoc(budgetsRef, budget);
    return {
      id: docRef.id,
      ...budget
    } as Budget;
  },

  async update(id: string, budget: Partial<Budget>) {
    if (USE_MOCK_DATA) {
      const index = mockBudgets.findIndex(b => b.id === id);
      if (index === -1) {
        throw new Error('Budget not found');
      }
      mockBudgets[index] = {
        ...mockBudgets[index],
        ...budget,
        updatedAt: new Date().toISOString(),
      };
      return mockBudgets[index];
    }

    const budgetRef = doc(firestore, COLLECTION_NAME, id);
    await updateDoc(budgetRef, budget);
    return {
      id,
      ...budget
    } as Budget;
  },

  async delete(id: string) {
    if (USE_MOCK_DATA) {
      const index = mockBudgets.findIndex(b => b.id === id);
      if (index === -1) {
        throw new Error('Budget not found');
      }
      mockBudgets.splice(index, 1);
      return;
    }

    const budgetRef = doc(firestore, COLLECTION_NAME, id);
    await deleteDoc(budgetRef);
  }
}; 