import api from './api';

export const reportService = {
  monthly: (year, month) => api.get('/reports/monthly', { params: { year, month } }).then((r) => r.data),
  yearly: (year) => api.get('/reports/yearly', { params: { year } }).then((r) => r.data),
  categories: (params) => api.get('/reports/categories', { params }).then((r) => r.data),
  paymentMethods: (params) => api.get('/reports/payment-methods', { params }).then((r) => r.data),
};
