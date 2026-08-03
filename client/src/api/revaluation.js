import apiClient from './apiClient.js';

export const revaluationService = {
  // ─── Revaluation Request CRUD ──────────────────────────────────────────────
  getAllRevaluationRequests: (params) => apiClient.get('/revaluation/requests', { params }),
  getRevaluationRequestById: (id) => apiClient.get(`/revaluation/requests/${id}`),
  createRevaluationRequest: (data) => apiClient.post('/revaluation/requests', data),
  updateRequestStatus: (id, statusData) => apiClient.put(`/revaluation/requests/${id}/status`, statusData),
  deleteRevaluationRequest: (id) => apiClient.delete(`/revaluation/requests/${id}`),

  // ─── Razorpay Payment ──────────────────────────────────────────────────────
  createRazorpayOrder: (data) => apiClient.post('/revaluation/payment/create-order', data),
  verifyRazorpayPayment: (data) => apiClient.post('/revaluation/payment/verify', data),
  getPaymentStatus: (studentId, semester) =>
    apiClient.get(`/revaluation/payment/status/${studentId}`, { params: { semester } }),
  verifyOrderStatus: (orderId, studentId, semester) =>
    apiClient.get(`/revaluation/payment/verify-order/${orderId}`, { params: { studentId, semester } }),

  // ─── Institute Specific ─────────────────────────────────────────────────────
  getInstituteSummary: () => apiClient.get('/revaluation/institute/summary'),
  getEligibleStudents: (params) => apiClient.get('/revaluation/institute/eligible-students', { params }),
  getSingleStudentEligibility: (studentId, params) =>
    apiClient.get(`/revaluation/institute/student/${studentId}/eligibility`, { params }),

  // ─── Academy Specific ──────────────────────────────────────────────────────
  getAcademySummary: (params) => apiClient.get('/revaluation/academy/summary', { params }),

  // ─── Revaluation Result Routes ─────────────────────────────────────────────
  getRevaluationResults: (id) => apiClient.get(`/revaluation/requests/${id}/results`),
  addRevaluationResult: (id, resultData) => apiClient.post(`/revaluation/requests/${id}/results`, resultData),
  approveRevaluationResult: (id, data) => apiClient.put(`/revaluation/results/${id}/approve`, data),

  // ─── Statistics ─────────────────────────────────────────────────────────────
  getRevaluationStatistics: (params) => apiClient.get('/revaluation/statistics', { params }),
};

export default revaluationService;
