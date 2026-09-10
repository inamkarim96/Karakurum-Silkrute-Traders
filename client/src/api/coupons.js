import api from './axios';

export const validateCoupon = async (code, subtotal) => {
  const response = await api.post('/coupons/validate', { code, subtotal });
  return response.data;
};
