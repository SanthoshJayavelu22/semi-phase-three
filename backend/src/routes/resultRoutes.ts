import express from 'express';
import {
  getAllResults,
  getResultById,
  getResultByStudent,
  createResult,
  updateResult,
  deleteResult,
  publishResult,
  searchResults,
  getResultStatistics,
  bulkUploadResults,
  downloadMarksheet,
  getStudentResultHistory,
  bulkUploadFromFile,
} from '../controllers/resultController';
import { protect, authorize } from '../middlewares/authMiddleware';
import { uploadMemory } from '../middlewares/uploadMiddleware';

const router = express.Router();

// Public routes (student access by enrollment ID)
router.get('/student/:enrollmentId', getResultByStudent);

// Protected routes
router.use(protect);

router.get('/', getAllResults);
router.get('/search', searchResults);
router.get('/statistics', authorize('admin', 'super_admin', 'board'), getResultStatistics);
router.get('/:id', getResultById);
router.post('/', authorize('admin', 'super_admin'), createResult);
router.put('/:id', authorize('admin', 'super_admin'), updateResult);
router.delete('/:id', authorize('admin', 'super_admin'), deleteResult);
router.put('/:id/publish', authorize('admin', 'super_admin', 'board'), publishResult);
router.post('/bulk', authorize('admin', 'super_admin'), bulkUploadResults);

// New: Bulk upload from file (DOCX, PDF, Excel, CSV)
router.post(
  '/bulk-upload-file',
  protect,
  authorize('admin', 'super_admin'),
  uploadMemory.single('file'),
  bulkUploadFromFile
);

// Marksheet download
router.get('/:id/marksheet', downloadMarksheet);

// Debug Route to seed SEMI-2026-9487
router.get('/debug/create-dummy', async (req, res) => {
  try {
    const Student = require('../models/studentModel').default;
    const Result = require('../models/resultModel').default;
    
    let student = await Student.findOne({ enrollmentId: 'SEMI-2026-9487' });
    if (!student) {
      student = await Student.create({
        enrollmentId: 'SEMI-2026-9487',
        firstName: 'Test',
        lastName: 'User',
        email: 'test9487@example.com',
        dateOfBirth: new Date('2026-07-21'),
      });
    } else {
      student.dateOfBirth = new Date('2026-07-21');
      await student.save();
    }
    
    let result = await Result.findOne({ student: student._id });
    if (!result) {
      await Result.create({
        student: student._id,
        academicYear: '2026',
        semester: 1,
        isPublished: false,
        subjects: []
      });
    }
    res.json({ message: 'Dummy created' });
  } catch (e) {
    res.json({ error: e instanceof Error ? e.message : 'Unknown error' });
  }
});

// User routes
router.get('/history/:studentId', getStudentResultHistory);

export default router;
