import api from './axios';

export const getNotifications = async (params) => {
  const response = await api.get('/admin/notifications', { params });
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await api.get('/admin/notifications/unread-count');
  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await api.patch(`/admin/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await api.patch('/admin/notifications/mark-all-read');
  return response.data;
};
