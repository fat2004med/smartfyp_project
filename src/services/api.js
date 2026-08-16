import axios from 'axios';

/**
 * Robust API Client for Vite + React + Express (Vercel Serverless & Local)
 * 
 * Normalizes VITE_API_URL to ensure calls to '/api/...' never produce duplicate '/api/api'
 * and always attach active JWT tokens and role headers.
 */
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    let clean = envUrl.trim().replace(/\/+$/, '');
    // If user provided a URL ending in '/api', remove trailing '/api'
    // so '/api/...' routes don't turn into '/api/api/...'
    if (clean.endsWith('/api')) {
      clean = clean.slice(0, -4);
    }
    return clean;
  }
  // Default to relative empty base for same-domain routing on Vercel
  return '';
};

export const API_BASE_URL = getBaseURL();

// Configure Global Axios Defaults
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;
axios.defaults.timeout = 30000;
axios.defaults.headers.common['Accept'] = 'application/json';

// Create configured Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

// Helper to attach authorization and role headers
const attachAuthAndNormalizeUrl = (config) => {
  try {
    // 1. Normalize duplicate /api prefixes if present
    if (config.url && config.url.startsWith('/api/api/')) {
      config.url = config.url.replace(/^\/api\/api\//, '/api/');
    }

    // 2. Attach JWT auth token
    const storedUser = localStorage.getItem('smartfyp_user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed?.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`;
      }
    }

    // 3. Attach selected role headers
    const activeRole = localStorage.getItem('activeDashboardRole');
    if (activeRole) {
      config.headers['X-Selected-Role'] = activeRole;
      config.headers['X-Active-Role'] = activeRole;
    }
  } catch (e) {
    console.warn('[API Client] Error attaching headers:', e);
  }

  return config;
};

// Apply interceptors to both `api` instance and the global `axios` instance
api.interceptors.request.use(attachAuthAndNormalizeUrl, (error) => Promise.reject(error));
axios.interceptors.request.use(attachAuthAndNormalizeUrl, (error) => Promise.reject(error));

// Response interceptors
const handleResponseSuccess = (response) => response;
const handleResponseError = (error) => {
  const status = error.response?.status;
  const message = error.response?.data?.message || error.message || 'Unknown network error';

  if (import.meta.env.DEV || (typeof window !== 'undefined' && window.__DEBUG_API__)) {
    console.error(`[API Error] ❌ ${status || 'TIMEOUT/NETWORK'}: ${message}`, error);
  }

  // Auto redirect to login on token expiration
  if (status === 401 && !error.config?.url?.includes('/api/auth/login')) {
    localStorage.removeItem('smartfyp_user');
    localStorage.removeItem('activeDashboardRole');
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login?expired=true';
    }
  }

  return Promise.reject(error);
};

api.interceptors.response.use(handleResponseSuccess, handleResponseError);
axios.interceptors.response.use(handleResponseSuccess, handleResponseError);

/**
 * Diagnostic & Connectivity helpers
 */
export const testApiConnection = async () => {
  try {
    const res = await axios.get('/api/test');
    return { success: true, data: res.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 0,
    };
  }
};

export const checkHealth = async () => {
  try {
    const res = await axios.get('/api/health');
    return { success: true, data: res.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 0,
    };
  }
};

// Expose API tester in browser window for easy debugging from console
if (typeof window !== 'undefined') {
  window.testApi = testApiConnection;
  window.checkHealth = checkHealth;
  window.apiClient = api;
}

export default api;

