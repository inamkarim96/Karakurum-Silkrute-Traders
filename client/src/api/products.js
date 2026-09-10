import api, { clearApiCache } from './axios';

// Simple client-side cache for products API
const apiCache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

const fetchWithCache = async (key, fetcher) => {
  const cached = apiCache.get(key);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }
  const data = await fetcher();
  apiCache.set(key, { data, timestamp: Date.now() });
  return data;
};

// Flush both the products-specific cache AND the axios GET cache
// so mutations always result in fresh data on next fetch
export const clearProductCache = () => {
  apiCache.clear();
  clearApiCache();
};

export const getProducts = async (params) => {
  const key = `products:${JSON.stringify(params)}`;
  return fetchWithCache(key, () => api.get('/products', { params }).then(res => res.data));
};

export const getAdminProducts = async (params) => {
  const response = await api.get('/admin/products', { params });
  return response.data;
};

export const getFeaturedProducts = async () => {
  return fetchWithCache('products:featured', () => api.get('/products/featured').then(res => res.data));
};

export const searchProducts = async (query) => {
  const key = `products:search:${query}`;
  return fetchWithCache(key, () => api.get('/products/search', { params: { q: query } }).then(res => res.data));
};

export const getProduct = async (id) => {
  const key = `product:${id}`;
  return fetchWithCache(key, () => api.get(`/products/${id}`).then(res => res.data));
};

export const getProductBySlug = async (slug) => {
  const key = `product:slug:${slug}`;
  return fetchWithCache(key, () => api.get(`/products/slug/${slug}`).then(res => res.data));
};

export const createProduct = async (data) => {
  const response = await api.post('/products', data);
  clearProductCache();
  return response.data;
};

export const updateProduct = async (id, data) => {
  const response = await api.put(`/products/${id}`, data);
  clearProductCache();
  return response.data;
};

export const updateStock = async (id, stock) => {
  const response = await api.patch(`/products/${id}/stock`, { stock });
  clearProductCache();
  return response.data;
};

export const updateVariantStock = async (productId, variantId, stock) => {
  const response = await api.patch(`/products/${productId}/variants/${variantId}/stock`, { stock });
  clearProductCache();
  return response.data;
};

export const toggleFeatured = async (id, is_featured) => {
  const response = await api.patch(`/products/${id}/featured`, { is_featured });
  clearProductCache();
  return response.data;
};

export const toggleActive = async (id, is_active) => {
  const response = await api.patch(`/products/${id}/active`, { is_active });
  clearProductCache();
  return response.data;
};

export const uploadProductImage = async (id, file) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post(`/products/${id}/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  clearProductCache();
  return response.data;
};

export const uploadCategoryImage = async (id, file) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post(`/categories/${id}/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  clearProductCache();
  return response.data;
};

export const deleteProductImage = async (id, imageUrl) => {
  const response = await api.delete(`/products/${id}/images`, { data: { image_url: imageUrl } });
  clearProductCache();
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  clearProductCache();
  return response.data;
};

export const getCategories = async () => {
  return fetchWithCache('categories', () => api.get('/categories').then(res => res.data));
};

export const getCategory = async (id) => {
  const key = `category:${id}`;
  return fetchWithCache(key, () => api.get(`/categories/${id}`).then(res => res.data));
};

export const createCategory = async (data) => {
  const response = await api.post('/categories', data);
  clearProductCache();
  return response.data;
};

export const updateCategory = async (id, data) => {
  const response = await api.put(`/categories/${id}`, data);
  clearProductCache();
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await api.delete(`/categories/${id}`);
  clearProductCache();
  return response.data;
};

export const initializeCategories = async () => {
  const response = await api.post('/categories/initialize');
  clearProductCache();
  return response.data;
};
