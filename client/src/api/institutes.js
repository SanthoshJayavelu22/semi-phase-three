import apiClient from './apiClient.js';

/**
 * Service for handling institute onboarding, payments, and reviews
 */
export const instituteService = {
  /**
   * Submit an institute fellowship application
   * Accepts multiple uploaded files via FormData
   * @param {FormData|Object} applicationData 
   */
  apply: (applicationData) => {
    let payload = applicationData;
    let headers = {};

    // If it's a plain object, convert it to FormData
    if (!(applicationData instanceof FormData)) {
      payload = new FormData();
      Object.keys(applicationData).forEach(key => {
        const val = applicationData[key];
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

    // Let Axios set the multipart header with boundary automatically
    let config = { 
      headers: { 
        ...headers,
        'Content-Type': undefined 
      } 
    };
    return apiClient.post('/institutes/apply', payload, config);
  },

  /**
   * Create Razorpay / Payment gateway order for inspection fees
   */
  createPaymentOrder: () => apiClient.post('/institutes/payment/create-order'),

  /**
   * Verify inspection fee payment details
   * @param {Object} paymentDetails - { razorpay_order_id, razorpay_payment_id, razorpay_signature }
   */
  verifyPayment: (paymentDetails) => apiClient.post('/institutes/payment/verify', paymentDetails),

  /**
   * Legacy/alias direct payment record creation or manual transaction upload
   * @param {FormData|Object} paymentData 
   */
  submitPaymentLegacy: (paymentData) => {
    let payload = paymentData;
    let headers = {};

    if (!(paymentData instanceof FormData)) {
      payload = new FormData();
      Object.keys(paymentData).forEach(key => {
        const val = paymentData[key];
        if (val !== null && val !== undefined) {
          if (val instanceof File || val instanceof Blob) {
            payload.append(key, val);
          } else {
            payload.append(key, String(val));
          }
        }
      });
    }

    // Let Axios set the multipart header with boundary automatically if it's FormData
    let config = { 
      headers: { 
        ...headers,
        'Content-Type': undefined 
      } 
    };
    return apiClient.post('/institutes/payment', payload, config);
  },

  /**
   * Board or Admin reviews an institute application
   * @param {string} instituteId 
   * @param {Object} reviewData - { status: 'Approved' | 'Rejected', remarks?: string }
   */
  reviewInstitute: (instituteId, reviewData) => 
    apiClient.post(`/institutes/${instituteId}/review`, reviewData),

  /**
   * Get current user's institute application details
   */
  getMyApplication: () => apiClient.get('/institutes/my-application'),

  /**
   * List all institute onboarding applications (board / admin only)
   */
  listApplications: () => apiClient.get('/institutes/applications'),

  /**
   * Toggle / trigger site inspection for an institute application
   * @param {string} instituteId 
   * @param {boolean} inspectionTriggered 
   */
  toggleInspection: (instituteId, inspectionTriggered) => 
    apiClient.patch(`/institutes/${instituteId}/inspection`, { inspectionTriggered }),
};

export default instituteService;