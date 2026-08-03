import apiClient from './apiClient.js';

export const feeService = {
  payStudentFees: (studentId, feeData) => apiClient.post(`/academic/students/${studentId}/fees`, feeData),
  getFeeRecords: () => apiClient.get('/academic/fees'),
  getFeeRecordsByStudent: (studentId) => apiClient.get(`/academic/students/${studentId}/fees`),
};

export default feeService;
