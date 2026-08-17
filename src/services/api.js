import axios from 'axios';

/**
 * Robust API Client for Vite + React + Express
 */

const getBaseURL = () => {
  // In development, use localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:3000';
  }
  
  // In production, use the environment variable or current origin
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    let clean = envUrl.trim().replace(/\/+$/, '');
    if (clean.endsWith('/api')) {
      clean = clean.slice(0, -4);
    }
    return clean;
  }
  
  // Fallback to current origin
  return window.location.origin;
};

export const API_BASE_URL = getBaseURL();

console.log('📡 API Base URL:', API_BASE_URL);

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
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      } catch (e) {
        // If storedUser is not valid JSON, ignore
      }
    }

    // Attach selected role headers
    const activeRole = localStorage.getItem('activeDashboardRole');
    if (activeRole) {
      config.headers['X-Selected-Role'] = activeRole;
      config.headers['X-Active-Role'] = activeRole;
    }
    
    console.log('📤 API Request:', config.method?.toUpperCase(), config.baseURL + config.url);
  } catch (e) {
    console.warn('[API Client] Error attaching headers:', e);
  }

  return config;
};

// Request interceptor
api.interceptors.request.use(attachAuthAndNormalizeUrl, (error) => Promise.reject(error));

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'Unknown network error';

    // Log errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      console.error(`[API Error] ❌ TIMEOUT: ${message}`);
    } else if (status) {
      console.error(`[API Error] ❌ ${status}: ${message}`);
    } else {
      console.error(`[API Error] ❌ NETWORK: ${message}`);
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
  }
);

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