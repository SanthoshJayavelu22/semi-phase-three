import apiClient from './apiClient.js';

export const revaluationService = {
  // Revaluation request CRUD
  getAllRevaluationRequests: (params) => apiClient.get('/revaluation/requests', { params }),
  getRevaluationRequestById: (id) => apiClient.get(`/revaluation/requests/${id}`),
  createRevaluationRequest: (data) => apiClient.post('/revaluation/requests', data),
  updateRequestStatus: (id, statusData) => apiClient.put(`/revaluation/requests/${id}/status`, statusData),
  deleteRevaluationRequest: (id) => apiClient.delete(`/revaluation/requests/${id}`),

  // Revaluation result routes
  getRevaluationResults: (id) => apiClient.get(`/revaluation/requests/${id}/results`),
  addRevaluationResult: (id, resultData) => apiClient.post(`/revaluation/requests/${id}/results`, resultData),
  approveRevaluationResult: (id) => apiClient.put(`/revaluation/results/${id}/approve`),

  // Statistics
  getRevaluationStatistics: (params) => apiClient.get('/revaluation/statistics', { params }),
};

export default revaluationService;
