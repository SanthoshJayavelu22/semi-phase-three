import express from 'express';
import {
  generateMarksheet,
  getAllMarksheets,
  getMarksheetById,
  updateMarksheet,
  deleteMarksheet,
  downloadMarksheet,
  getStudentMarksheets,
  bulkGenerateMarksheets,
} from '../controllers/marksheetController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(protect);

// Marksheet CRUD
router.get('/', getAllMarksheets);
router.get('/:id', getMarksheetById);
router.get('/:id/download', downloadMarksheet);
router.get('/student/:studentId', getStudentMarksheets);

router.post('/', authorize('admin', 'super_admin'), generateMarksheet);
router.post('/bulk', authorize('admin', 'super_admin'), bulkGenerateMarksheets);
router.put('/:id', authorize('admin', 'super_admin'), updateMarksheet);
router.delete('/:id', authorize('admin', 'super_admin'), deleteMarksheet);

export default router;
