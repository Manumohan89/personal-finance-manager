import api from './api';

export const goalService = {
  list: () => api.get('/goals').then((r) => r.data),
  create: (payload) => api.post('/goals', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/goals/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/goals/${id}`).then((r) => r.data),
  deposit: (id, amount) => api.post(`/goals/${id}/deposit`, { amount }).then((r) => r.data),
  withdraw: (id, amount) => api.post(`/goals/${id}/withdraw`, { amount }).then((r) => r.data),
};
