import apiClient from './apiClient.js';

export const resultService = {
  // Public routes
  getResultByStudent: (enrollmentId) => apiClient.get(`/results/student/${enrollmentId}`),

  // Protected routes
  getAllResults: (params) => apiClient.get('/results', { params }),
  searchResults: (params) => apiClient.get('/results/search', { params }),
  getResultStatistics: (params) => apiClient.get('/results/statistics', { params }),
  getResultById: (id) => apiClient.get(`/results/${id}`),
  createResult: (data) => apiClient.post('/results', data),
  updateResult: (id, data) => apiClient.put(`/results/${id}`, data),
  deleteResult: (id) => apiClient.delete(`/results/${id}`),
  publishResult: (id) => apiClient.put(`/results/${id}/publish`),
  bulkUploadResults: (data) => apiClient.post('/results/bulk', data),
  
  bulkUploadFromFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/results/bulk-upload-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  downloadMarksheet: (id) => apiClient.get(`/results/${id}/marksheet`, { responseType: 'blob' }),
  getStudentResultHistory: (studentId) => apiClient.get(`/results/history/${studentId}`),
};

export default resultService;
