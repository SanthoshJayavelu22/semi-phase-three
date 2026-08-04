import axios from 'axios';

export const getBaseURL = () => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003/api';
    }
  } catch { /* ignore */ }
  return 'http://localhost:5003/api';
};

export const getUploadUrl = (filename) => {
  if (!filename) return '';

  const baseUrl = getBaseURL().replace(/\/api$/, '');
  const clean = String(filename).replace(/\\/g, '/');

  // Full absolute URLs.
  if (/^https?:\/\//i.test(clean)) {
    // Cloudinary (https://res.cloudinary.com/...) and other external URLs pass
    // through unchanged. But a backend-hosted upload URL that was baked with a
    // different BASE_URL (e.g. the production domain) gets rewritten to the
    // current API origin so local/dev environments resolve against the local
    // backend instead of hitting a dead link.
    const uploadPathMatch = clean.match(/\/(?:api\/)?uploads\/[^?#]+/i);
    if (uploadPathMatch) {
      return `${baseUrl}/${uploadPathMatch[0].replace(/^\/+/, '')}`;
    }
    return clean;
  }

  // Relative backend path variants → resolve to the current API origin.
  // Handles `/api/uploads/...`, `uploads/...`, bare filenames, and even
  // Windows-style absolute paths that still reference an uploads/ folder.
  let rel = clean;
  const relMatch = rel.match(/(?:^|\/)(?:api\/)?uploads\/([^?#]+)$/i);
  if (relMatch) {
    rel = relMatch[1];
  } else {
    const last = rel.split('/').pop();
    if (last) rel = last;
  }
  return `${baseUrl}/api/uploads/${rel}`;
};

// ─── Token Management ──────────────────────────────────────────────────────────

const TOKEN_KEYS = {
  access: 'semi_access_token',
  refresh: 'semi_refresh_token',
};

export const getRefreshToken = () => {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEYS.refresh)
      || localStorage.getItem('semi_refreshToken')
      || localStorage.getItem('refreshToken');
  } catch { return null; }
};

export const getAccessToken = () => {
  try {
    if (typeof localStorage === 'undefined' || typeof window === 'undefined') return null;
    // Context-aware token selection to prevent 403s when switching portals
    if (window.location.pathname.startsWith('/institute')) {
      return localStorage.getItem('semi_institute_token')
        || localStorage.getItem(TOKEN_KEYS.access)
        || localStorage.getItem('semi_token')
        || localStorage.getItem('token');
    }
    if (window.location.pathname.startsWith('/academy')) {
      return localStorage.getItem('semi_board_token')
        || localStorage.getItem(TOKEN_KEYS.access)
        || localStorage.getItem('semi_token')
        || localStorage.getItem('token');
    }
    return localStorage.getItem(TOKEN_KEYS.access)
      || localStorage.getItem('semi_token')
      || localStorage.getItem('token');
  } catch { return null; }
};

export const setTokens = (accessToken, refreshToken) => {
  try {
    if (typeof localStorage === 'undefined') return;
    if (accessToken) {
      localStorage.setItem(TOKEN_KEYS.access, accessToken);
      localStorage.setItem('semi_token', accessToken);
      localStorage.setItem('token', accessToken);
      if (typeof window !== 'undefined') {
        if (window.location.pathname.startsWith('/institute')) {
          localStorage.setItem('semi_institute_token', accessToken);
        } else if (window.location.pathname.startsWith('/academy')) {
          localStorage.setItem('semi_board_token', accessToken);
        }
      }
    }
    if (refreshToken) {
      localStorage.setItem(TOKEN_KEYS.refresh, refreshToken);
      localStorage.setItem('semi_refreshToken', refreshToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
  } catch { /* ignore */ }
};

export const clearAllTokens = () => {
  try {
    if (typeof localStorage === 'undefined') return;
    [
      'token',
      'semi_token',
      'semi_institute_token',
      'semi_board_token',
      'refreshToken',
      'semi_refreshToken',
      TOKEN_KEYS.access,
      TOKEN_KEYS.refresh,
      'semi_user',
      'semi_board_user',
      'semi_registered_email',
    ].forEach((key) => {
      try { localStorage.removeItem(key); } catch { /* ignore */ }
    });
    try { sessionStorage.clear(); } catch { /* ignore */ }
  } catch { /* ignore */ }
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

// Clear every auth token so the user is forced to log in again
const clearStoredSession = () => {
  clearAllTokens();
};

// Hard-redirect to the correct portal login page
const redirectToLogin = () => {
  if (typeof window === 'undefined') return;
  window.location.href = window.location.pathname.startsWith('/institute')
    ? '/institute/login'
    : '/academy/login';
};

// Request interceptor to automatically add Authorization header
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error handling and auto refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // A request retried with a freshly refreshed token that STILL 401s means the
    // user account no longer exists (deleted / DB re-seeded) or the token is dead.
    // Refresh succeeded but protect() couldn't find the user — force re-login.
    if (error.response?.status === 401 && originalRequest?._retry) {
      clearStoredSession();
      redirectToLogin();
      return Promise.reject(error);
    }

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
        const refreshToken = getRefreshToken();
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
          setTokens(newAccessToken, newRefreshToken);
          
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
        clearStoredSession();
        redirectToLogin();
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
    if (error.response?.data?.errors?.length > 0 && Array.isArray(error.response.data.errors)) {
      message = error.response.data.errors;
    }
    
    // Attach the cleaned message to the error object so components can use it directly
    error.parsedMessage = message;
    
    return Promise.reject(error);
  }
);

export default apiClient;