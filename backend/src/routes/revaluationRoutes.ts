import express from 'express';
import {
  createRevaluationRequest,
  getAllRevaluationRequests,
  getRevaluationRequestById,
  updateRequestStatus,
  addRevaluationResult,
  getRevaluationResults,
  approveRevaluationResult,
  getRevaluationStatistics,
  deleteRevaluationRequest,
  getEligibleStudents,
  getSingleStudentEligibility,
  getInstituteSummary,
  getAcademySummary,
  createRevaluationRazorpayOrder,
  verifyRevaluationRazorpayPayment,
  getRevaluationPaymentStatus,
  verifyRevaluationOrderStatus,
} from '../controllers/revaluationController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(protect);

// ─── Razorpay Payment Routes ──────────────────────────────────────────────────
router.post('/payment/create-order', authorize('institute'), createRevaluationRazorpayOrder);
router.post('/payment/verify', authorize('institute'), verifyRevaluationRazorpayPayment);
router.get('/payment/status/:studentId', authorize('institute'), getRevaluationPaymentStatus);
router.get('/payment/verify-order/:orderId', authorize('institute'), verifyRevaluationOrderStatus);

// ─── Institute Routes ──────────────────────────────────────────────────────
router.get('/institute/summary', authorize('institute'), getInstituteSummary);
router.get('/institute/eligible-students', authorize('institute'), getEligibleStudents);
router.get('/institute/student/:studentId/eligibility', authorize('institute'), getSingleStudentEligibility);

// ─── Academy Routes ────────────────────────────────────────────────────────
router.get('/academy/summary', authorize('admin', 'super_admin', 'board'), getAcademySummary);

// Revaluation request CRUD
router.get('/requests', getAllRevaluationRequests);
router.get('/requests/:id', getRevaluationRequestById);
router.post('/requests', authorize('institute', 'admin', 'super_admin'), createRevaluationRequest);
router.put('/requests/:id/status', authorize('admin', 'super_admin', 'board'), updateRequestStatus);
router.delete('/requests/:id', authorize('admin', 'super_admin'), deleteRevaluationRequest);

// Revaluation result routes
router.get('/requests/:id/results', getRevaluationResults);
router.post('/requests/:id/results', authorize('admin', 'super_admin', 'board'), addRevaluationResult);
router.put('/results/:id/approve', authorize('admin', 'super_admin', 'board'), approveRevaluationResult);

// Statistics
router.get('/statistics', authorize('admin', 'super_admin', 'board'), getRevaluationStatistics);

export default router;
