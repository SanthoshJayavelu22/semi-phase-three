import apiClient from './apiClient';

export const checkHealth = () => apiClient.get('/health');
