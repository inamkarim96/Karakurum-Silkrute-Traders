import api, { clearApiCache } from './axios';

export const getProductReviews = async (productId, params = {}) => {
  const response = await api.get(`/reviews/product/${productId}`, { params });
  return response.data;
};

export const createReview = async (reviewData) => {
  const response = await api.post('/reviews', reviewData);
  clearApiCache();
  return response.data;
};

export const deleteReview = async (reviewId) => {
  const response = await api.delete(`/reviews/${reviewId}`);
  clearApiCache();
  return response.data;
};
