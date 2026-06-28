import apiClient from './apiClient.js';

/**
 * Service for handling academic ERP operations (courses, batches, students, remittance)
 */
export const academicService = {
  // ─── COURSE CRUD ─────────────────────────────────────────────────────────────
  createCourse: (courseData) => apiClient.post('/academic/courses', courseData),
  getCourses: () => apiClient.get('/academic/courses'),
  getCourseById: (courseId) => apiClient.get(`/academic/courses/${courseId}`),
  updateCourse: (courseId, courseData) => apiClient.put(`/academic/courses/${courseId}`, courseData),
  deleteCourse: (courseId) => apiClient.delete(`/academic/courses/${courseId}`),

  // ─── BATCH CRUD ──────────────────────────────────────────────────────────────
  createBatch: (batchData) => apiClient.post('/academic/batches', batchData),
  getBatches: () => apiClient.get('/academic/batches'),
  getBatchById: (batchId) => apiClient.get(`/academic/batches/${batchId}`),
  getBatchesByCourse: (courseId) => apiClient.get(`/academic/batches/course/${courseId}`),
  updateBatch: (batchId, batchData) => apiClient.put(`/academic/batches/${batchId}`, batchData),
  deleteBatch: (batchId) => apiClient.delete(`/academic/batches/${batchId}`),

  // ─── STUDENT MANAGEMENT ──────────────────────────────────────────────────────
  enrollStudent: (studentData) => {
    let payload = studentData;
    let headers = {};

    if (!(studentData instanceof FormData)) {
      payload = new FormData();
      Object.keys(studentData).forEach(key => {
        const val = studentData[key];
        if (val !== null && val !== undefined) {
          if (val instanceof File || val instanceof Blob) {
            payload.append(key, val);
          } else if (typeof val === 'object' && !(val instanceof Date)) {
            payload.append(key, JSON.stringify(val));
          } else if (val instanceof Date) {
            payload.append(key, val.toISOString());
          } else {
            payload.append(key, String(val));
          }
        }
      });
    }

    headers['Content-Type'] = 'multipart/form-data';
    return apiClient.post('/academic/students', payload, { headers });
  },

  payStudentFees: (studentId, feeData) => {
    let payload = feeData;
    let headers = {};

    if (!(feeData instanceof FormData)) {
      payload = new FormData();
      Object.keys(feeData).forEach(key => {
        const val = feeData[key];
        if (val !== null && val !== undefined) {
          if (val instanceof File || val instanceof Blob) {
            payload.append(key, val);
          } else if (val instanceof Date) {
            payload.append(key, val.toISOString());
          } else {
            payload.append(key, String(val));
          }
        }
      });
    }

    headers['Content-Type'] = 'multipart/form-data';
    return apiClient.post(`/academic/students/${studentId}/fees`, payload, { headers });
  },

  getFeeRecords: () => apiClient.get('/academic/fees'),

  getFeeRecordsByStudent: (studentId) => apiClient.get(`/academic/students/${studentId}/fees`),

  getPayableRemittance: () => apiClient.get('/academic/remittance/payable'),

  submitRemittance: (remittanceData) => {
    let payload = remittanceData;
    let headers = {};

    if (!(remittanceData instanceof FormData)) {
      payload = new FormData();
      Object.keys(remittanceData).forEach(key => {
        const val = remittanceData[key];
        if (val !== null && val !== undefined) {
          if (val instanceof File || val instanceof Blob) {
            payload.append(key, val);
          } else if (Array.isArray(val)) {
            payload.append(key, JSON.stringify(val));
          } else if (val instanceof Date) {
            payload.append(key, val.toISOString());
          } else {
            payload.append(key, String(val));
          }
        }
      });
    }

    headers['Content-Type'] = 'multipart/form-data';
    return apiClient.post('/academic/remittance', payload, { headers });
  },

  getRemittances: () => apiClient.get('/academic/remittance'),

  listStudents: (params) => {
    const cleanParams = {};
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          cleanParams[key] = params[key];
        }
      });
    }
    return apiClient.get('/academic/students', { params: cleanParams });
  },

  updateAcademicMetrics: (studentId, metrics) => {
    let payload = metrics;
    let headers = {};

    if (!(metrics instanceof FormData)) {
      payload = new FormData();
      Object.keys(metrics).forEach(key => {
        const val = metrics[key];
        if (val !== null && val !== undefined) {
          if (val instanceof File || val instanceof Blob) {
            payload.append(key, val);
          } else if (typeof val === 'boolean') {
            payload.append(key, val ? 'true' : 'false');
          } else {
            payload.append(key, String(val));
          }
        }
      });
    }

    headers['Content-Type'] = 'multipart/form-data';
    return apiClient.patch(`/academic/students/${studentId}/academic-metrics`, payload, { headers });
  },

  evaluateEligibility: (studentId) => apiClient.get(`/academic/students/${studentId}/eligibility`),

  updateStudent: (studentId, studentData) => {
    let payload = studentData;
    let headers = {};

    if (studentData instanceof FormData) {
      headers['Content-Type'] = 'multipart/form-data';
    }

    return apiClient.put(`/academic/students/${studentId}`, payload, { headers });
  },

  deleteStudent: (studentId) => apiClient.delete(`/academic/students/${studentId}`),

  getStudentById: (studentId) => apiClient.get(`/academic/students/${studentId}`),
};

export default academicService;