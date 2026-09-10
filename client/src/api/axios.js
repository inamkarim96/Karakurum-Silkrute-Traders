import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL?.endsWith('/api')
  ? import.meta.env.VITE_API_URL
  : `${import.meta.env.VITE_API_URL || ''}/api`;

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Simple In-Memory Cache for GET requests
const CACHE_TTL = 120 * 1000; // 2 minutes
const getCache = new Map();

// Helper to clear cache manually if needed (e.g., after mutations)
export const clearApiCache = () => {
  getCache.clear();
};

// Interceptor 1: Token Attach & Cache Check
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // 2. Cache Check (Only GET, exclude Auth)
    if (config.method?.toLowerCase() === 'get' && !config.url?.includes('/auth')) {
      // Include auth state in the key — prevents logged-out responses leaking to logged-in users
      const authIndicator = token ? 'authed' : 'anon';
      const cacheKey = `${config.url}?${new URLSearchParams(config.params || {}).toString()}&_a=${authIndicator}`;
      const cached = getCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        config.adapter = () => {
          return Promise.resolve({
            data: cached.data,
            status: 200,
            statusText: 'OK',
            headers: cached.headers,
            config,
            request: {}
          });
        };
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor 2: Response Handling & Cache Save
api.interceptors.response.use(
  (response) => {
    // Save successful GET requests to cache (keyed with auth state)
    if (response.config.method?.toLowerCase() === 'get' && !response.config.url?.includes('/auth')) {
      const authIndicator = localStorage.getItem('auth_token') ? 'authed' : 'anon';
      const cacheKey = `${response.config.url}?${new URLSearchParams(response.config.params || {}).toString()}&_a=${authIndicator}`;
      getCache.set(cacheKey, {
        timestamp: Date.now(),
        data: response.data,
        headers: response.headers
      });
    }
    return response;
  },
  (error) => {
     // If backend returns 401, clear the local session.
    if (error.response?.status === 401 && !error.config.url?.includes('/auth')) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

