/**
 * Centralized API & Backend URL resolver.
 * Strictly reads from environment variables (.env / Vercel Environment Variables).
 * Automatically handles common URL typos and relative fallbacks.
 */

function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url
    .trim()
    .replace('karakurum-silkrute-traders-server-b.vercel.app', 'karakurum-silkrute-traders-server.vercel.app')
    .replace(/\/+$/, '');
}

export function getBackendBase() {
  const envBackend = sanitizeUrl(import.meta.env.VITE_BACKEND_URL);
  if (envBackend) {
    return envBackend;
  }

  const envApi = sanitizeUrl(import.meta.env.VITE_API_URL);
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
  const envApi = sanitizeUrl(import.meta.env.VITE_API_URL);
  if (envApi) {
    return envApi.endsWith('/api') ? envApi : `${envApi}/api`;
  }

  const envBackend = sanitizeUrl(import.meta.env.VITE_BACKEND_URL);
  if (envBackend) {
    return `${envBackend}/api`;
  }

  // Relative / same-origin fallback
  return '/api';
}
