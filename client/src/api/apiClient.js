import axios from 'axios';

export const getBaseURL = () => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003/api';
    }
  } catch (e) {}
  return 'http://localhost:5003/api';
};

export const getUploadUrl = (filename) => {
  if (!filename) return '';
  // If the filename is already a full URL (like from cloudinary), return it directly
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  
  const baseUrl = getBaseURL().replace(/\/api$/, '');
  // ensure clean joining
  const cleanFilename = filename.replace(/\\/g, '/').split('/').pop();
  return `${baseUrl}/api/uploads/${cleanFilename}`;
};

const apiClient = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple refresh token requests
let isRefreshing = false;
let refreshSubscribers = [];

// Helper to add subscribers
const onRefreshed = (token) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

// Helper to subscribe to token refresh
const addRefreshSubscriber = (cb) => {
  refreshSubscribers.push(cb);
};

// Request interceptor to automatically add Authorization header
apiClient.interceptors.request.use(
  (config) => {
    try {
      if (typeof localStorage !== 'undefined') {
        const token = localStorage.getItem('token') || localStorage.getItem('semi_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (e) {}
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error handling and auto refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh for auth endpoints to avoid loops
      if (originalRequest.url?.includes('/auth/refresh-token') || 
          originalRequest.url?.includes('/auth/login')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve) => {
          addRefreshSubscriber((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken') || localStorage.getItem('semi_refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call the refresh-token API endpoint
        const response = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh-token`, 
          { token: refreshToken }
        );
        
        const data = response.data?.data || response.data || {};
        const newAccessToken = data.accessToken || data.token;
        const newRefreshToken = data.refreshToken;
        
        if (newAccessToken) {
          localStorage.setItem('token', newAccessToken);
          localStorage.setItem('semi_token', newAccessToken);
          
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
            localStorage.setItem('semi_refreshToken', newRefreshToken);
          }
          
          // Update the authorization header of the original request and retry
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          
          // Notify all subscribers
          onRefreshed(newAccessToken);
          
          return apiClient(originalRequest);
        } else {
          throw new Error('No access token received');
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Clear tokens if refresh fails to force logout
        localStorage.removeItem('token');
        localStorage.removeItem('semi_token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('semi_refreshToken');
        localStorage.removeItem('semi_board_user');
        // Redirect to login if in browser
        if (typeof window !== 'undefined') {
          if (window.location.pathname.startsWith('/institute')) {
            window.location.href = '/institute/login';
          } else {
            window.location.href = '/academy/login';
          }
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Extract meaningful error message from backend response
    let message = 
      error.response?.data?.message || 
      error.response?.data?.error || 
      (typeof error.response?.data === 'string' ? error.response.data : null) ||
      (error.response?.status === 401 ? 'Invalid credentials. Please check your email and password.' : error.message) || 
      "An unexpected error occurred. Please try again.";
    
    // Support structured validation error lists from backend (e.g. Zod validation arrays)
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
      message = error.response.data.errors;
    }
    
    // Attach the cleaned message to the error object so components can use it directly
    error.parsedMessage = message;
    
    return Promise.reject(error);
  }
);

export default apiClient;