import apiClient from './apiClient.js';

/**
 * Service for handling authentication routes
 */
export const authService = {
  /**
   * Register a new user/institute
   * @param {Object} userData 
   */
  register: (userData) => apiClient.post('/auth/register', userData),

  /**
   * Log in to the application
   * @param {Object} credentials 
   */
  login: (credentials) => apiClient.post('/auth/login', credentials),

  /**
   * Log out of the application
   */
  logout: () => apiClient.post('/auth/logout'),

  /**
   * Refresh authorization token
   * @param {string} token 
   */
  refreshToken: (token) => apiClient.post('/auth/refresh-token', { token }),

  /**
   * Request password reset link
   * @param {string} email 
   */
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),

  /**
   * Reset password with token
   * @param {Object} resetData - { token, newPassword }
   */
  resetPassword: (resetData) => apiClient.post('/auth/reset-password', resetData),

  /**
   * Verify email via verification token
   * @param {string} token - The verification token
   */
  verifyEmail: (token) => {
    // Ensure token is properly encoded for URL
    const encodedToken = encodeURIComponent(token);
    return apiClient.get(`/auth/verify-email/${encodedToken}`);
  },

  /**
   * Check email verification and user details status
   */
  checkStatus: () => apiClient.get('/auth/status'),
};

export default authService;