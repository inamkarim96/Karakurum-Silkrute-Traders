/**
 * Centralized API & Backend URL resolver.
 *
 * In production the app talks to the same origin it was served from (`/api`).
 * Vercel routes that path to the API function (see vercel.json), so the
 * frontend never depends on a hardcoded backend hostname and requests can
 * never be blocked by CORS or a renamed/deleted deployment URL.
 *
 * Local development still uses VITE_API_URL / VITE_BACKEND_URL from .env.
 */

const isBrowser = typeof window !== 'undefined';
const isProduction = import.meta.env.PROD;

function cleanUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\/+$/, '');
}

export function getBackendBase() {
  // Same origin as the page: /api is proxied by Vercel.
  if (isProduction && isBrowser) {
    return window.location.origin;
  }

  const envBackend = cleanUrl(import.meta.env.VITE_BACKEND_URL);
  if (envBackend) {
    return envBackend;
  }

  const envApi = cleanUrl(import.meta.env.VITE_API_URL);
  if (envApi) {
    return envApi.replace(/\/api\/?$/, '');
  }

  return isBrowser ? window.location.origin : '';
}

export function getApiBase() {
  // Relative base: avoids CORS entirely and follows the deployed domain.
  if (isProduction && isBrowser) {
    return '/api';
  }

  const envApi = cleanUrl(import.meta.env.VITE_API_URL);
  if (envApi) {
    return envApi.endsWith('/api') ? envApi : `${envApi}/api`;
  }

  const envBackend = cleanUrl(import.meta.env.VITE_BACKEND_URL);
  if (envBackend) {
    return `${envBackend}/api`;
  }

  return '/api';
}
