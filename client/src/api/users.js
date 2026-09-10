import api from './axios';

export const getMyAddresses = async () => {
  const response = await api.get('/users/me/addresses');
  return response.data;
};

export const addAddress = async (data) => {
  const response = await api.post('/users/me/addresses', data);
  return response.data;
};

export const updateAddress = async (id, data) => {
  const response = await api.put(`/users/me/addresses/${id}`, data);
  return response.data;
};

export const deleteAddress = async (id) => {
  const response = await api.delete(`/users/me/addresses/${id}`);
  return response.data;
};
