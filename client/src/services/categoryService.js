import api from './api';

export const categoryService = {
  list: (type) => api.get('/categories', { params: type ? { type } : {} }).then((r) => r.data),
  create: (payload) => api.post('/categories', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/categories/${id}`, payload).then((r) => r.data),
  remove: (id, reassignTo) => api.delete(`/categories/${id}`, { data: reassignTo ? { reassignTo } : {} }).then((r) => r.data),
};

export const paymentMethodService = {
  list: () => api.get('/payment-methods').then((r) => r.data),
  create: (payload) => api.post('/payment-methods', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/payment-methods/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/payment-methods/${id}`).then((r) => r.data),
};
