import axios from 'axios';

/**
 * Robust API Client for Vite + React + Express (Vercel Serverless & Local)
 * 
 * Uses import.meta.env.VITE_API_URL if provided, otherwise defaults to relative '/api'
 * so same-origin requests on Vercel or custom domains route directly.
 */
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    // Strip trailing slash if present
    const cleanUrl = envUrl.trim().replace(/\/+$/, '');
    // If user provided origin without /api, keep base as cleanUrl
    return cleanUrl.endsWith('/api') ? cleanUrl : cleanUrl;
  }
  // Default to relative empty base so '/api/...' calls hit the same host (e.g. your-app.vercel.app/api)
  return '';
};

export const API_BASE_URL = getBaseURL();

// Create configured Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout for serverless cold starts
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

// Request Interceptor: Attach JWT Token & Active Role
api.interceptors.request.use(
  (config) => {
    try {
      const storedUser = localStorage.getItem('smartfyp_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed?.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      }

      const activeRole = localStorage.getItem('activeDashboardRole');
      if (activeRole) {
        config.headers['X-Selected-Role'] = activeRole;
      }
    } catch (e) {
      console.warn('[API Client] Error attaching auth headers:', e);
    }

    // Log outgoing requests during debugging/development
    if (import.meta.env.DEV || window.__DEBUG_API__) {
      console.log(`[API Request] 🚀 ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url}`, config);
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response Interceptor: Format error messages and handle session expiry
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV || window.__DEBUG_API__) {
      console.log(`[API Response] ✅ ${response.status} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'Unknown network error';
    
    console.error(`[API Response Error] ❌ ${status || 'TIMEOUT/NETWORK'}: ${message}`, error);

    // Global session expiration handler (401 Unauthorized)
    if (status === 401 && !error.config?.url?.includes('/api/auth/login')) {
      console.warn('[API Client] Session expired or invalid token. Redirecting to login.');
      localStorage.removeItem('smartfyp_user');
      localStorage.removeItem('activeDashboardRole');
      if (window.location.pathname !== '/login') {
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

// Also synchronize global axios defaults so direct `axios.get('/api/...')` calls work seamlessly
if (API_BASE_URL) {
  axios.defaults.baseURL = API_BASE_URL;
}
axios.defaults.withCredentials = true;

// Expose API tester in browser window for easy debugging from console
if (typeof window !== 'undefined') {
  window.testApi = testApiConnection;
  window.checkHealth = checkHealth;
  window.apiClient = api;
}

export default api;
