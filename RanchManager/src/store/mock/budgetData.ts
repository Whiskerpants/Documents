import { Budget } from '../types/financial';

const now = new Date();
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
const endOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
const startOfYear = new Date(now.getFullYear(), 0, 1);
const endOfYear = new Date(now.getFullYear(), 11, 31);

export const mockBudgets: Budget[] = [
  {
    id: '1',
    name: 'Monthly Operations Budget',
    description: 'Monthly budget for ranch operations',
    startDate: startOfMonth.toISOString(),
    endDate: endOfMonth.toISOString(),
    periodType: 'monthly',
    isActive: true,
    total: 50000,
    spent: 35000,
    categoryAllocations: {
      feed: 20000,
      veterinary: 10000,
      labor: 15000,
      equipment: 5000,
    },
    categorySpent: {
      feed: 18000,
      veterinary: 8000,
      labor: 7000,
      equipment: 2000,
    },
    notes: 'Monthly operational expenses for the ranch',
    createdAt: startOfMonth.toISOString(),
    updatedAt: now.toISOString(),
  },
  {
    id: '2',
    name: 'Q2 Equipment Budget',
    description: 'Quarterly budget for equipment maintenance and purchases',
    startDate: startOfQuarter.toISOString(),
    endDate: endOfQuarter.toISOString(),
    periodType: 'quarterly',
    isActive: true,
    total: 100000,
    spent: 85000,
    categoryAllocations: {
      equipment: 60000,
      maintenance: 40000,
    },
    categorySpent: {
      equipment: 50000,
      maintenance: 35000,
    },
    notes: 'Q2 equipment and maintenance budget',
    createdAt: startOfQuarter.toISOString(),
    updatedAt: now.toISOString(),
  },
  {
    id: '3',
    name: 'Annual Marketing Budget',
    description: 'Yearly budget for marketing and promotions',
    startDate: startOfYear.toISOString(),
    endDate: endOfYear.toISOString(),
    periodType: 'yearly',
    isActive: true,
    total: 150000,
    spent: 160000,
    categoryAllocations: {
      advertising: 80000,
      events: 40000,
      materials: 30000,
    },
    categorySpent: {
      advertising: 85000,
      events: 45000,
      materials: 30000,
    },
    notes: 'Annual marketing and promotional activities',
    createdAt: startOfYear.toISOString(),
    updatedAt: now.toISOString(),
  },
  {
    id: '4',
    name: 'Upcoming Expansion Budget',
    description: 'Budget for upcoming ranch expansion project',
    startDate: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
    endDate: new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString(),
    periodType: 'quarterly',
    isActive: false,
    total: 250000,
    spent: 0,
    categoryAllocations: {
      construction: 150000,
      equipment: 75000,
      permits: 25000,
    },
    categorySpent: {},
    notes: 'Budget for Q3 expansion project',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
  {
    id: '5',
    name: 'Expired Q1 Budget',
    description: 'Q1 budget for general operations',
    startDate: new Date(now.getFullYear(), 0, 1).toISOString(),
    endDate: new Date(now.getFullYear(), 2, 31).toISOString(),
    periodType: 'quarterly',
    isActive: false,
    total: 75000,
    spent: 72000,
    categoryAllocations: {
      feed: 30000,
      veterinary: 20000,
      labor: 15000,
      utilities: 10000,
    },
    categorySpent: {
      feed: 28000,
      veterinary: 19000,
      labor: 15000,
      utilities: 10000,
    },
    notes: 'Q1 general operations budget',
    createdAt: new Date(now.getFullYear(), 0, 1).toISOString(),
    updatedAt: new Date(now.getFullYear(), 2, 31).toISOString(),
  },
]; 