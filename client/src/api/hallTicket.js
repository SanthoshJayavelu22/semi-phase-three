// client/src/api/hallTicket.js
import apiClient from './apiClient';

export const hallTicketAPI = {
  // Create a single hall ticket
  create: (data) => apiClient.post('/hall-tickets/create', data),

  // Get hall ticket by ID
  getById: (id) => apiClient.get(`/hall-tickets/${id}`),

  // Generate PDF for a hall ticket
  generatePDF: (id, templateId) => 
    apiClient.get(`/hall-tickets/${id}/pdf`, {
      params: { templateId },
      responseType: 'blob'
    }),

  // Template management
  getTemplates: () => apiClient.get('/hall-tickets/templates'),
  createTemplate: (data) => apiClient.post('/hall-tickets/templates', data),
  updateTemplate: (id, data) => apiClient.put(`/hall-tickets/templates/${id}`, data),

  // Bulk operations
  generateBulk: (data) => apiClient.post('/hall-tickets/bulk-generate', data),

  // Get hall tickets by exam
  getByExam: (examId) => apiClient.get(`/hall-tickets/exam/${examId}`),

  // Get hall tickets by student
  getByStudent: (studentId) => apiClient.get(`/hall-tickets/student/${studentId}`)
};