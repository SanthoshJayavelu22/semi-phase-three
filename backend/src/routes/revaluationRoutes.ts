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
} from '../controllers/revaluationController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(protect);

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
