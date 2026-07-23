import apiClient from './apiClient.js';

export const certificateService = {
  getAllCertificates: (params) => apiClient.get('/certificates', { params }),
  getCertificateById: (id) => apiClient.get(`/certificates/${id}`),
  downloadCertificate: (id) => apiClient.get(`/certificates/${id}/download`, { responseType: 'blob' }),
  getStudentCertificates: (studentId) => apiClient.get(`/certificates/student/${studentId}`),

  issueCertificate: (data) => apiClient.post('/certificates', data),
  generateProvisionalCertificate: (data) => apiClient.post('/certificates/provisional', data),
  
  updateCertificate: (id, data) => apiClient.put(`/certificates/${id}`, data),
  verifyCertificate: (id) => apiClient.put(`/certificates/${id}/verify`),
  revokeCertificate: (id) => apiClient.put(`/certificates/${id}/revoke`),
  deleteCertificate: (id) => apiClient.delete(`/certificates/${id}`),
};

export default certificateService;
