import api from './axios';

//  Admin: Orders 
export const getAllOrders = async (params) => {
  const response = await api.get('/admin/orders', { params });
  return response.data;
};

export const updateOrderStatus = async (orderId, data) => {
  const response = await api.patch(`/admin/orders/${orderId}`, data);
  return response.data;
};

export const getOrderDetails = async (orderId) => {
  const response = await api.get(`/admin/orders/${orderId}`);
  return response.data;
};

export const updateOrderNotes = async (orderId, notes) => {
  const response = await api.patch(`/admin/orders/${orderId}/notes`, { notes });
  return response.data;
};

//  Admin: Analytics 
export const getAnalytics = async () => {
  const response = await api.get('/admin/analytics/overview');
  return response.data;
};

//  Admin: Users 
export const getAllUsers = async (params) => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

export const updateUserStatus = async (userId, is_active) => {
  const response = await api.patch(`/admin/users/${userId}/status`, { is_active });
  return response.data;
};
