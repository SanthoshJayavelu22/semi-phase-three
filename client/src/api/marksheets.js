import apiClient from './apiClient.js';

export const marksheetService = {
  getAllMarksheets: (params) => apiClient.get('/marksheets', { params }),
  getMarksheetById: (id) => apiClient.get(`/marksheets/${id}`),
  downloadMarksheet: (id) => apiClient.get(`/marksheets/${id}/download`, { responseType: 'blob' }),
  getStudentMarksheets: (studentId) => apiClient.get(`/marksheets/student/${studentId}`),
  
  generateMarksheet: (data) => apiClient.post('/marksheets', data),
  bulkGenerateMarksheets: (data) => apiClient.post('/marksheets/bulk', data),
  
  updateMarksheet: (id, data) => apiClient.put(`/marksheets/${id}`, data),
  deleteMarksheet: (id) => apiClient.delete(`/marksheets/${id}`),
};

export default marksheetService;
