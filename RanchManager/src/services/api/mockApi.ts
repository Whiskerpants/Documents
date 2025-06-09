import { FinancialSettings } from '../../store/types/financial';

export const mockApi = {
  updateFinancialSettings: async (settings: FinancialSettings) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return { data: settings };
  },
}; 