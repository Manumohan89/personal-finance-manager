import api from './api';

export const planService = {
  list: () => api.get('/plans').then((r) => r.data),
  get: (id) => api.get(`/plans/${id}`).then((r) => r.data),
  create: (payload) => api.post('/plans', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/plans/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/plans/${id}`).then((r) => r.data),
};
