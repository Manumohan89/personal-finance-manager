import api from './api';

export const userService = {
  getProfile: () => api.get('/users/profile').then((r) => r.data),
  updateProfile: (payload) => api.put('/users/profile', payload).then((r) => r.data),
  updatePassword: (payload) => api.put('/users/password', payload).then((r) => r.data),
};
