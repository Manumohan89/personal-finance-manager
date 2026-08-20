import api from './api';

export const recurringService = {
  list: () => api.get('/recurring').then((r) => r.data),
  create: (payload) => api.post('/recurring', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/recurring/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/recurring/${id}`).then((r) => r.data),
};
