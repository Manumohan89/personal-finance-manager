import api from './api';

export const dashboardService = {
  summary: () => api.get('/dashboard/summary').then((r) => r.data),
  monthly: (year, month) => api.get('/dashboard/monthly', { params: { year, month } }).then((r) => r.data),
  categories: (year, month, type) => api.get('/dashboard/categories', { params: { year, month, type } }).then((r) => r.data),
};
