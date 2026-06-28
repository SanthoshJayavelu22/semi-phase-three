import apiClient from './apiClient.js';

const buildFormData = (payload) => {
  if (payload instanceof FormData) return payload;
  const fd = new FormData();
  Object.keys(payload).forEach(key => {
    const val = payload[key];
    if (val === null || val === undefined) return;
    if (Array.isArray(val)) {
      val.forEach(v => fd.append(key, v));
    } else if (val instanceof File || val instanceof Blob) {
      fd.append(key, val);
    } else {
      fd.append(key, String(val));
    }
  });
  return fd;
};

export const examService = {
  // ─── Exam Application CRUD ──────────────────────────────────────────────────
  applyForExam: (payload) => {
    const data = buildFormData(payload);
    return apiClient.post('/exams/apply', data, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  listExamApplications: (params) => apiClient.get('/exams', { params }),

  getExamApplicationById: (id) => apiClient.get(`/exams/${id}`),

  updateExamApplication: (id, payload) => apiClient.put(`/exams/${id}`, payload),

  deleteExamApplication: (id) => apiClient.delete(`/exams/${id}`),

  // ─── UC 4.2: Approval & Scheduling (Board) ──────────────────────────────────
  reviewExamApplication: (id, payload) => apiClient.put(`/exams/${id}/review`, payload),

  publishExamSchedule: (id, payload) => apiClient.put(`/exams/${id}/publish-schedule`, payload),

  // ─── UC 4.3: Hall Tickets ────────────────────────────────────────────────────
  generateHallTickets: (id) => apiClient.post(`/exams/${id}/generate-hall-tickets`),

  listHallTickets: (id) => apiClient.get(`/exams/${id}/hall-tickets`),

  getHallTicketById: (id, hid) => apiClient.get(`/exams/${id}/hall-tickets/${hid}`),

  downloadHallTicket: (id, hid) => apiClient.get(`/exams/${id}/hall-tickets/${hid}/download`),
};

export default examService;
