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
    const Course = require('../models/courseModel').default;
    const Batch = require('../models/batchModel').default;
    const Institute = require('../models/instituteModel').default;

    // Reuse an existing course/batch/institute if available so the dummy
    // student satisfies all required schema fields.
    const course = await Course.findOne({});
    const batch = await Batch.findOne({});
    const institute = await Institute.findOne({});
    
    let student = await Student.findOne({ enrollmentId: 'SEMI-2026-9487' });
    if (!student) {
      student = await Student.create({
        enrollmentId: 'SEMI-2026-9487',
        firstName: 'Test',
        lastName: 'User',
        email: 'test9487@example.com',
        dateOfBirth: new Date('2026-07-21'),
        homeAddress: '123 Test Street, Test City',
        contactNumber: '9876543210',
        qualification: 'MBBS',
        mbbsQualification: 'MBBS Degree',
        yearOfPassing: 2025,
        universityName: 'Test University',
        medicalCouncilRegistrationNumber: 'MC-TEST9487',
        isForeignGraduate: false,
        fmgeClearanceStatus: 'Not Applicable',
        course: course?._id,
        batch: batch?._id,
        institute: institute?._id,
        courseDirector: 'Dr. Test Director',
        documents: {
          passportPhotoUrl: 'http://example.com/photo.jpg',
          mbbsCertificateUrl: 'http://example.com/mbbs.pdf',
          medicalCouncilRegistrationCertificateUrl: 'http://example.com/registration.pdf',
          semiMembershipFormUrl: 'http://example.com/membership.pdf',
        },
        remittedToAcademy: false,
        semesters: [{ semesterNumber: 1, attendancePercentage: 0, thesisApproved: false, eligibilityStatus: 'Pending' }],
      });
    } else {
      student.dateOfBirth = new Date('2026-07-21');
      if (!student.homeAddress) student.homeAddress = '123 Test Street, Test City';
      if (!student.contactNumber) student.contactNumber = '9876543210';
      if (!student.qualification) student.qualification = 'MBBS';
      if (!student.mbbsQualification) student.mbbsQualification = 'MBBS Degree';
      if (!student.yearOfPassing) student.yearOfPassing = 2025;
      if (!student.universityName) student.universityName = 'Test University';
      if (!student.medicalCouncilRegistrationNumber) student.medicalCouncilRegistrationNumber = 'MC-TEST9487';
      if (student.isForeignGraduate === undefined) student.isForeignGraduate = false;
      if (!student.fmgeClearanceStatus) student.fmgeClearanceStatus = 'Not Applicable';
      if (!student.course) student.course = course?._id;
      if (!student.batch) student.batch = batch?._id;
      if (!student.institute) student.institute = institute?._id;
      if (!student.courseDirector) student.courseDirector = 'Dr. Test Director';
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
