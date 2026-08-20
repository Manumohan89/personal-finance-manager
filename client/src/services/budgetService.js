import api from './api';

export const budgetService = {
  list: (year, month) => api.get('/budgets', { params: { year, month } }).then((r) => r.data),
  create: (payload) => api.post('/budgets', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/budgets/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/budgets/${id}`).then((r) => r.data),
};
