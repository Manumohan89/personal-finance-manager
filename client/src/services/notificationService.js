import api from './api';

export const notificationService = {
  list: () => api.get('/notifications').then((r) => r.data),
  markRead: (id) => api.put(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.put('/notifications/read-all').then((r) => r.data),
  remove: (id) => api.delete(`/notifications/${id}`).then((r) => r.data),
};
