const CURRENCY_LOCALE = { INR: 'en-IN', USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB' };

export const formatCurrency = (amount, currency = 'INR') => {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency] || 'en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDate = (date, options = { day: '2-digit', month: 'short', year: 'numeric' }) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', options);
};

export const formatPercent = (value) => `${value > 0 ? '+' : ''}${value}%`;

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
