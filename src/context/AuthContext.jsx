import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const logout = () => {
    setUser(null);
    localStorage.removeItem('smartfyp_user');
    localStorage.removeItem('activeDashboardRole');
  };

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('smartfyp_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
      }
      const storedRole = localStorage.getItem('activeDashboardRole');
      if (storedRole) {
        axios.defaults.headers.common['X-Selected-Role'] = storedRole;
      }
      return parsedUser;
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const verifySession = async () => {
      const stored = localStorage.getItem('smartfyp_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${parsed.token}`;
            const { data } = await axios.get('/api/users/profile');
            // Update details with latest DB values but keep original token
            const updatedUser = { ...data, token: parsed.token };
            setUser(updatedUser);
            localStorage.setItem('smartfyp_user', JSON.stringify(updatedUser));
          }
        } catch (err) {
          if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem('smartfyp_user');
            setUser(null);
            window.location.href = '/login';
          }
        }
      }
    };
    verifySession();
  }, []);

  useEffect(() => {
    if (!user) {
      const headers = axios.defaults.headers.common;
      if (headers) {
        if (headers['Authorization']) delete headers['Authorization'];
        if (headers['X-Selected-Role']) delete headers['X-Selected-Role'];
      }
    }
  }, [user]);

  useEffect(() => {
    // Axios interceptor for request
    const reqInterceptor = axios.interceptors.request.use(
      (config) => {
        const storedUser = localStorage.getItem('smartfyp_user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            if (parsed?.token) {
              config.headers = config.headers || {};
              config.headers['Authorization'] = `Bearer ${parsed.token}`;
            }
          } catch (e) {
            // ignore JSON error
          }
        }

        const storedRole = localStorage.getItem('activeDashboardRole');
        if (storedRole) {
          config.headers = config.headers || {};
          config.headers['X-Selected-Role'] = storedRole;
          config.headers['X-Active-Role'] = storedRole;
        } else if (config.headers) {
          delete config.headers['X-Selected-Role'];
          delete config.headers['X-Active-Role'];
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Axios interceptor for handling 401 & 403 (Deactivated or Deleted)
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Don't intercept for the login request itself
        if ((error.response?.status === 401 || error.response?.status === 403) && !error.config.url.includes('/api/auth/login')) {
          logout();
          window.location.href = '/login';
        }
        
        // Universal Error Message Toast
        const isNotificationPoll = error.config?.url?.includes('/api/notifications') && error.config?.method === 'get';
        
        let message = error.response?.data?.message;
        if (!message) {
          if (error.code === 'ECONNABORTED') message = "Request timed out";
          else if (error.message === 'Network Error') message = "Network Error: Could not reach the server";
          else message = "An unexpected error occurred";
        }
        
        // Skip toast for certain requests and cancelations
        if (
          !axios.isCancel(error) && 
          !error.config?.url?.includes('/api/auth/check') && 
          !error.config?.url?.includes('/api/projects/my-project') &&
          !isNotificationPoll
        ) {
           toast.error(message);
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('smartfyp_user', JSON.stringify(userData));
    if (userData.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
    }
    const storedRole = localStorage.getItem('activeDashboardRole');
    if (storedRole) {
      axios.defaults.headers.common['X-Selected-Role'] = storedRole;
    } else {
      delete axios.defaults.headers.common['X-Selected-Role'];
    }
  };

  const updateUser = (updatedData) => {
    setUser(prevUser => {
      const newUser = { ...prevUser, ...updatedData };
      localStorage.setItem('smartfyp_user', JSON.stringify(newUser));
      if (newUser.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${newUser.token}`;
      }
      const storedRole = localStorage.getItem('activeDashboardRole');
      if (storedRole) {
        axios.defaults.headers.common['X-Selected-Role'] = storedRole;
      }
      return newUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
