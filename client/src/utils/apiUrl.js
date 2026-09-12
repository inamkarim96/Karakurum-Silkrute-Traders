/**
 * Centralized API & Backend URL resolver.
 * Strictly reads from environment variables (.env / Vercel Environment Variables).
 * No URLs are hardcoded in source code.
 */

export function getBackendBase() {
  const envBackend = import.meta.env.VITE_BACKEND_URL;
  if (envBackend) {
    return envBackend.replace(/\/+$/, '');
  }

  const envApi = import.meta.env.VITE_API_URL;
  if (envApi) {
    return envApi.replace(/\/api\/?$/, '');
  }

  // Relative / same-origin fallback
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
}

export function getApiBase() {
  const envApi = import.meta.env.VITE_API_URL;
  if (envApi) {
    return envApi.endsWith('/api') ? envApi : `${envApi.replace(/\/+$/, '')}/api`;
  }

  const envBackend = import.meta.env.VITE_BACKEND_URL;
  if (envBackend) {
    return `${envBackend.replace(/\/+$/, '')}/api`;
  }

  // Relative / same-origin fallback
  return '/api';
}
