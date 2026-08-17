import axios from 'axios';

/**
 * Robust API Client for Vite + React + Express
 * Works seamlessly across AI Studio Cloud Preview, Railway, Vercel, and Localhost.
 */
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    let clean = envUrl.trim().replace(/\/+$/, '');
    if (clean.endsWith('/api')) {
      clean = clean.slice(0, -4);
    }
    return clean;
  }
  
  // Default to relative base (empty string) so requests route to the current domain
  return '';
};

export const API_BASE_URL = getBaseURL();

// Configure Global Axios Defaults
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;
axios.defaults.timeout = 60000;
axios.defaults.headers.common['Accept'] = 'application/json';

// Create configured Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

// Helper to attach authorization and role headers
const attachAuthAndNormalizeUrl = (config) => {
  try {
    // Normalize duplicate /api prefixes
    if (config.url && config.url.startsWith('/api/api/')) {
      config.url = config.url.replace(/^\/api\/api\//, '/api/');
    }

    // Attach JWT auth token
    const storedUser = localStorage.getItem('smartfyp_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      } catch (e) {
        // If storedUser is not valid JSON, ignore
      }
    }

    // Attach selected role headers
    const activeRole = localStorage.getItem('activeDashboardRole');
    if (activeRole) {
      config.headers = config.headers || {};
      config.headers['X-Selected-Role'] = activeRole;
      config.headers['X-Active-Role'] = activeRole;
    }
  } catch (e) {
    console.warn('[API Client] Error attaching headers:', e);
  }

  return config;
};

// Request interceptors on both api and global axios
api.interceptors.request.use(attachAuthAndNormalizeUrl, (error) => Promise.reject(error));
axios.interceptors.request.use(attachAuthAndNormalizeUrl, (error) => Promise.reject(error));

// Response interceptors on both api and global axios
const handleResponseSuccess = (response) => response;
const handleResponseError = (error) => {
  const status = error.response?.status;
  const message = error.response?.data?.message || error.message || 'Unknown network error';
  const url = error.config?.url || '';

  // Skip noisy logs for benign 404 queries or cancelations
  const isMutedUrl = url.includes('/api/projects/my-project') || url.includes('/api/notifications');

  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    console.warn(`[API Warning] TIMEOUT: ${message}`);
  } else if (status && !isMutedUrl) {
    console.warn(`[API Info] ${status}: ${message}`);
  }

  // Auto redirect to login on token expiration
  if (status === 401 && !url.includes('/api/auth/login') && !url.includes('/api/auth/check')) {
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
    const res = await api.get('/api/test');
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
    const res = await api.get('/api/health');
    return { success: true, data: res.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 0,
    };
  }
};

// Expose API tester in browser window for easy debugging
if (typeof window !== 'undefined') {
  window.testApi = testApiConnection;
  window.checkHealth = checkHealth;
  window.apiClient = api;
}

export default api;