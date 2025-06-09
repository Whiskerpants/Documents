import { i18n } from '../i18n';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat(i18n.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}; 