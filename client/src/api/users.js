import apiClient from './apiClient.js';

/**
 * Service for handling user-related admin routes
 */
export const userService = {
  /**
   * Get all registered users (super_admin only)
   */
  getUsers: () => apiClient.get('/users'),

  /**
   * Create a new admin account (super_admin only)
   * @param {Object} adminData 
   */
  createAdmin: (adminData) => apiClient.post('/users/create-admin', adminData),
};

export default userService;
