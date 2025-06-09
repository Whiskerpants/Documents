import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      common: {
        locale: 'en-US',
      },
      financial: {
        entityProfitability: {
          title: 'Entity Profitability',
          cattle: 'Cattle',
          groups: 'Groups',
          totalIncome: 'Total Income',
          totalExpenses: 'Total Expenses',
          netProfit: 'Net Profit',
          profitTrend: 'Profit Trend',
          categoryBreakdown: 'Category Breakdown',
          recentTransactions: 'Recent Transactions',
        },
      },
    },
  },
  es: {
    translation: {
      common: {
        locale: 'es-ES',
      },
      financial: {
        entityProfitability: {
          title: 'Rentabilidad de la Entidad',
          cattle: 'Ganado',
          groups: 'Grupos',
          totalIncome: 'Ingresos Totales',
          totalExpenses: 'Gastos Totales',
          netProfit: 'Beneficio Neto',
          profitTrend: 'Tendencia de Beneficios',
          categoryBreakdown: 'Desglose por Categoría',
          recentTransactions: 'Transacciones Recientes',
        },
      },
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export { i18n }; 