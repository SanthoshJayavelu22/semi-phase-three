import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware';
import {
  getStudentsWithMarks,
  getStudentMarks,
  updateStudentMarks,
  bulkUpdateMarks,
  getCourseSubjects,
  generateResultsFromMarks,
  publishResults,
  getPublicationStatus,
} from '../controllers/marksController';

const router = express.Router();

// ─── Routes ──────────────────────────────────────────────────────────────────

// Get all students with marks (with filters)
router.get(
  '/students',
  protect,
  authorize('admin', 'super_admin', 'board', 'institute'),
  getStudentsWithMarks
);

// Get course subjects
router.get(
  '/courses/:courseId/subjects',
  protect,
  authorize('admin', 'super_admin', 'board', 'institute'),
  getCourseSubjects
);

// Get a single student's marks
router.get(
  '/students/:studentId',
  protect,
  authorize('admin', 'super_admin', 'board', 'institute'),
  getStudentMarks
);

// Update a single student's marks
router.put(
  '/students/:studentId',
  protect,
  authorize('admin', 'super_admin', 'board', 'institute'),
  updateStudentMarks
);

// Bulk update marks for multiple students
router.post(
  '/students/bulk',
  protect,
  authorize('admin', 'super_admin', 'board', 'institute'),
  bulkUpdateMarks
);

// ─── Result Generation & Publishing Routes ──────────────────────────────────

// Generate results from marks
router.post(
  '/generate-results',
  protect,
  authorize('admin', 'super_admin', 'board'),
  generateResultsFromMarks
);

// Publish results
router.post(
  '/publish-results',
  protect,
  authorize('admin', 'super_admin', 'board'),
  publishResults
);

// Get publication status
router.get(
  '/publication-status',
  protect,
  authorize('admin', 'super_admin', 'board'),
  getPublicationStatus
);

export default router;
