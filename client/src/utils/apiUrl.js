/**
 * Centralized API & Backend URL resolver.
 * 
 * Automatically detects whether the app is running in a live production
 * environment (e.g. *.vercel.app) or locally, preventing hardcoded localhost
 * fallbacks in production bundles.
 */

const PROD_BACKEND_DEFAULT = 'https://karakurum-silkrute-traders-server-b.vercel.app';

export function getBackendBase() {
  const envBackend = import.meta.env.VITE_BACKEND_URL;
  if (envBackend && !envBackend.includes('localhost')) {
    return envBackend.replace(/\/+$/, '');
  }

  const envApi = import.meta.env.VITE_API_URL;
  if (envApi && !envApi.includes('localhost')) {
    return envApi.replace(/\/api\/?$/, '');
  }

  // Running in browser on a production domain (Vercel, custom domain, etc.)
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return PROD_BACKEND_DEFAULT;
  }

  return envBackend || 'http://localhost:5000';
}

export function getApiBase() {
  const envApi = import.meta.env.VITE_API_URL;
  if (envApi && !envApi.includes('localhost')) {
    return envApi.endsWith('/api') ? envApi : `${envApi.replace(/\/+$/, '')}/api`;
  }

  const envBackend = import.meta.env.VITE_BACKEND_URL;
  if (envBackend && !envBackend.includes('localhost')) {
    return `${envBackend.replace(/\/+$/, '')}/api`;
  }

  // Running in browser on a production domain
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return `${PROD_BACKEND_DEFAULT}/api`;
  }

  return envApi || 'http://localhost:5000/api';
}
