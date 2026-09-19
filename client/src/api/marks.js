import apiClient from './apiClient.js';

export const marksService = {
  // Get all students with marks
  getStudentsWithMarks: (params) => apiClient.get('/marks/students', { params }),

  // Get a single student's marks
  getStudentMarks: (studentId, examinationNumber) =>
    apiClient.get(`/marks/students/${studentId}`, { params: { examinationNumber } }),

  // Update a single student's marks
  updateStudentMarks: (studentId, data) =>
    apiClient.put(`/marks/students/${studentId}`, data),

  // Bulk update marks
  bulkUpdateMarks: (data) =>
    apiClient.post('/marks/students/bulk', data),

  // Get course subjects
  getCourseSubjects: (courseId, examinationNumber) =>
    apiClient.get(`/marks/courses/${courseId}/subjects`, {
      params: examinationNumber ? { examinationNumber } : undefined,
    }),

  // Generate results from marks
  generateResults: (data) => apiClient.post('/marks/generate-results', data),

  // Publish results
  publishResults: (data) => apiClient.post('/marks/publish-results', data),

  // Get publication status
  getPublicationStatus: (params) => apiClient.get('/marks/publication-status', { params }),
};

export default marksService;
