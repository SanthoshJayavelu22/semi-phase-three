import apiClient from './apiClient.js';

export const marksService = {
  // Get all students with marks
  getStudentsWithMarks: (params) => apiClient.get('/marks/students', { params }),

  // Get a single student's marks
  getStudentMarks: (studentId, semesterNumber) =>
    apiClient.get(`/marks/students/${studentId}`, { params: { semesterNumber } }),

  // Update a single student's marks
  updateStudentMarks: (studentId, data) =>
    apiClient.put(`/marks/students/${studentId}`, data),

  // Bulk update marks
  bulkUpdateMarks: (data) =>
    apiClient.post('/marks/students/bulk', data),

  // Get course subjects
  getCourseSubjects: (courseId) =>
    apiClient.get(`/marks/courses/${courseId}/subjects`),

  // Generate results from marks
  generateResults: (data) => apiClient.post('/marks/generate-results', data),

  // Publish results
  publishResults: (data) => apiClient.post('/marks/publish-results', data),

  // Get publication status
  getPublicationStatus: (params) => apiClient.get('/marks/publication-status', { params }),
};

export default marksService;
