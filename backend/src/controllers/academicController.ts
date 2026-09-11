import { Request, Response } from 'express';
import { z } from 'zod';
import { Course } from '../models/courseModel';
import { Batch } from '../models/batchModel';
import { Student } from '../models/studentModel';
import { FeeRecord } from '../models/feeRecordModel';
import { Remittance } from '../models/remittanceModel';
import { Institute } from '../models/instituteModel';
import { Result } from '../models/resultModel';
import { sendSuccess, sendError } from '../utils/responseFormatter';
import { getFeeCategory, getFeeCategoryLabel } from '../utils/feeCategories';
import { resolveFeeConfiguration, checkStudentReappearance, getExamFeeConfigEntry, setExamFeeConfigEntry } from '../services/examFeeService';
import razorpayInstance, { isRazorpayConfigured, keyId, keySecret } from '../config/razorpay';
import crypto from 'crypto';
import { getFileUrl } from '../utils/fileHelpers';

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const examinationSubjectSchema = z.object({
  code: z.string().optional().default(''),
  name: z.string().min(1, 'Subject Name is required'),
});

const examinationPracticalSchema = z.object({
  code: z.string().optional().default(''),
  name: z.string().min(1, 'Practical Exam Name is required'),
});

const courseExaminationSchema = z.object({
  examinationNumber: z.coerce.number().min(1, 'Examination number is required').max(10, 'A course can have at most 10 examinations'),
  examinationName: z.string().optional().default(''),
  monthsRequired: z.coerce.number().min(0).optional().default(0),
  subjects: z.preprocess(
    (val) => (Array.isArray(val) ? val.filter((s: any) => s && typeof s.name === 'string' && s.name.trim().length > 0) : []),
    z.array(examinationSubjectSchema).optional().default([])
  ),
  practicalExams: z.preprocess(
    (val) => (Array.isArray(val) ? val.filter((p: any) => p && typeof p.name === 'string' && p.name.trim().length > 0) : []),
    z.array(examinationPracticalSchema).optional().default([])
  ),
});

const courseCreateSchema = z.object({
  name: z.string().min(1, 'Course Name is required'),
  courseCode: z.string().optional(),
  courseType: z.string().optional(),
  programCategory: z.string().optional(),
  courseDuration: z.string().optional(),
  durationType: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  practicalExamName: z.string().optional(),
  practicalExams: z.array(z.string()).optional(),
  examinations: z.array(courseExaminationSchema).optional(),
  status: z.enum(['Active', 'Inactive', 'Pending']).optional(),
  examinationFee: z.coerce.number().min(0).optional(),
  reappearingExaminationFee: z.coerce.number().min(0).optional(),
  feeApplicableForFirstAttempt: z.preprocess(
    (val) => String(val).toLowerCase() === 'true' || val === '1' || val === true || val === 1,
    z.boolean()
  ).optional(),
});

const courseUpdateSchema = z.object({
  name: z.string().min(1, 'Course Name is required').optional(),
  courseCode: z.string().optional(),
  courseType: z.string().optional(),
  programCategory: z.string().optional(),
  courseDuration: z.string().optional(),
  durationType: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  practicalExamName: z.string().optional(),
  practicalExams: z.array(z.string()).optional(),
  examinations: z.array(courseExaminationSchema).optional(),
  status: z.enum(['Active', 'Inactive', 'Pending']).optional(),
  examinationFee: z.coerce.number().min(0).optional(),
  reappearingExaminationFee: z.coerce.number().min(0).optional(),
  feeApplicableForFirstAttempt: z.preprocess(
    (val) => String(val).toLowerCase() === 'true' || val === '1' || val === true || val === 1,
    z.boolean()
  ).optional(),
});

const batchCreateSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  year: z.coerce.number().min(1900).max(2100, 'Invalid batch year'),
  name: z.string().optional(),
  startDate: z.string().optional(),
  seats: z.coerce.number().min(1).optional().default(5),
});

const batchUpdateSchema = z.object({
  name: z.string().optional(),
  year: z.coerce.number().min(1900).max(2100, 'Invalid batch year').optional(),
  startDate: z.string().optional(),
  seats: z.coerce.number().min(1).optional(),
  status: z.enum(['Active', 'Inactive', 'Completed']).optional(),
});

const studentAddSchema = z.object({
  firstName: z.string().min(1, 'First Name is required'),
  lastName: z.string().min(1, 'Last Name is required'),
  homeAddress: z.string().min(1, 'Home Address is required'),
  contactNumber: z.string().regex(/^[0-9]{10,15}$/, 'Must be a valid mobile number format'),
  email: z.string().email('Must be a valid email format'),
  dateOfBirth: z.string().min(1, 'Date of Birth is required'),
  qualification: z.string().min(1, 'Qualification is mandatory'),
  mbbsQualification: z.string().min(1, 'MBBS Qualification is mandatory'),
  yearOfPassing: z.coerce.number().min(1900).max(2100, 'Invalid year of passing'),
  universityName: z.string().min(1, 'University Name is required'),
  medicalCouncilRegistrationNumber: z.string().min(1, 'Medical Council Registration Number is required'),
  isForeignGraduate: z.preprocess(
    (val) => String(val).toLowerCase() === 'true' || val === '1' || val === true || val === 1,
    z.boolean()
  ),
  fmgeClearanceStatus: z.enum(['Cleared', 'Not Applicable', 'Failed']).default('Not Applicable'),
  courseId: z.string().min(1, 'Course is required'),
  batchId: z.string().min(1, 'Batch is required'),
  courseDirector: z.string().min(1, 'Course Director is required'),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional(),
  paymentMode: z.string().optional().default('Razorpay'),
  paymentDate: z.string().optional(),
});

const studentUpdateSchema = z.object({
  firstName: z.string().min(1, 'First Name is required').optional(),
  lastName: z.string().min(1, 'Last Name is required').optional(),
  homeAddress: z.string().min(1, 'Home Address is required').optional(),
  contactNumber: z.string().regex(/^[0-9]{10,15}$/, 'Must be a valid mobile number format').optional(),
  email: z.string().email('Must be a valid email format').optional(),
  qualification: z.string().min(1, 'Qualification is mandatory').optional(),
  mbbsQualification: z.string().min(1, 'MBBS Qualification is mandatory').optional(),
  yearOfPassing: z.coerce.number().min(1900).max(2100, 'Invalid year of passing').optional(),
  universityName: z.string().min(1, 'University Name is required').optional(),
  medicalCouncilRegistrationNumber: z.string().min(1, 'Medical Council Registration Number is required').optional(),
  isForeignGraduate: z.preprocess(
    (val) => String(val).toLowerCase() === 'true' || val === '1' || val === true || val === 1,
    z.boolean()
  ).optional(),
  fmgeClearanceStatus: z.enum(['Cleared', 'Not Applicable', 'Failed']).optional(),
  courseId: z.string().min(1, 'Course is required').optional(),
  batchId: z.string().min(1, 'Batch is required').optional(),
  courseDirector: z.string().min(1, 'Course Director is required').optional(),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional(),
});

const feeRecordSchema = z.object({
  examinationNumber: z.coerce.number().min(1, 'Examination Number is required').max(2),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  paymentMode: z.string().min(1, 'Payment Mode is required'),
  utrNumber: z.string().optional(),
  paymentDate: z.string().transform((val) => new Date(val)),
  paymentPurpose: z.string().min(1, 'Payment Purpose is required'),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional(),
});

const reimbursableFeeSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  examinationNumber: z.coerce.number().min(1, 'Examination Number is required').max(2),
  firstAttemptFee: z.coerce.number().min(0, 'First attempt fee cannot be negative').optional().default(0),
  reappearingFee: z.coerce.number().min(0, 'Reappearing fee cannot be negative').optional().default(0),
  feeApplicableForFirstAttempt: z.preprocess(
    (val) => String(val).toLowerCase() === 'true' || val === '1' || val === true || val === 1,
    z.boolean()
  ).optional().default(false),
});

const remittanceSchema = z.object({
  totalAmount: z.coerce.number().min(0.01, 'Total Amount must be greater than 0'),
  paymentPurpose: z.string().optional().default('Student Fellowship Fee Remittance'),
  remarks: z.string().optional().default(''),
  utrNumber: z.string().optional(),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional(),
  paymentMode: z.string().optional().default('Razorpay Online'),
  paymentDate: z.string().optional().transform((val) => (val ? new Date(val) : new Date())),
  studentIds: z.preprocess(
    (val) => (typeof val === 'string' ? JSON.parse(val) : val),
    z.array(z.string()).optional()
  ),
});

// ==========================================
// COURSE CRUD OPERATIONS
// ==========================================

// ─── Create Course (Admin / Board only) ───────────────────────────────────────
export const createCourse = async (req: Request, res: Response) => {
  try {
    const validatedData = courseCreateSchema.parse(req.body);

    // Check for duplicate course name globally
    const existingCourse = await Course.findOne({ 
      name: { $regex: new RegExp(`^${validatedData.name}$`, 'i') } 
    });
    if (existingCourse) {
      return sendError({ req, res, statusCode: 400, message: 'A course with this name already exists in the centralized catalog.' });
    }

    if (validatedData.examinations && Array.isArray(validatedData.examinations)) {
      if (!validatedData.subjects || validatedData.subjects.length === 0) {
        const flatSubs: string[] = [];
        validatedData.examinations.forEach(s => {
          (s.subjects || []).forEach(sub => {
            if (sub.name) {
              flatSubs.push(sub.code ? `${sub.code}: ${sub.name}` : sub.name);
            }
          });
        });
        validatedData.subjects = flatSubs;
      }
      if (!validatedData.practicalExams || validatedData.practicalExams.length === 0) {
        const flatPracs: string[] = [];
        validatedData.examinations.forEach(s => {
          (s.practicalExams || []).forEach(prac => {
            if (prac.name) {
              flatPracs.push(prac.code ? `${prac.code}: ${prac.name}` : prac.name);
            }
          });
        });
        validatedData.practicalExams = flatPracs;
      }
    }

    const newCourse = await Course.create({
      ...validatedData,
      status: validatedData.status || 'Active',
    });

    return sendSuccess({
      req,
      res,
      statusCode: 201,
      message: 'Course created successfully in centralized catalog',
      data: newCourse,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) throw error;
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ─── Get All Courses ──────────────────────────────────────────────────────────
export const getCourses = async (req: Request, res: Response) => {
  try {
    const query: any = {};
    if (req.user?.role === 'institute') {
      // Institutes see all Active standardized courses defined by the Board
      query.status = 'Active';
    }
    const courses = await Course.find(query).sort({ createdAt: -1 });
    
    // Fetch batch and student counts for each course
    const coursesWithCounts = await Promise.all(courses.map(async (course) => {
      const batchesCount = await Batch.countDocuments({ course: course._id });
      const studentsCount = await Student.countDocuments({ course: course._id });
      return {
        ...course.toObject(),
        batchesCount,
        studentsCount
      };
    }));

    return sendSuccess({ req, res, message: 'Courses retrieved successfully', data: coursesWithCounts });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ─── Get Single Course ────────────────────────────────────────────────────────
export const getCourseById = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const query: any = { _id: courseId };

    if (req.user.role === 'institute') {
      const institute = await Institute.findOne({ user: req.user._id, status: 'Approved' });
      if (!institute) {
        return sendError({ req, res, statusCode: 403, message: 'Access Denied: Your institute application is not approved yet.' });
      }
    }

    const course = await Course.findOne(query);
    if (!course) {
      return sendError({ req, res, statusCode: 404, message: 'Course not found' });
    }

    // Get batch count and student count
    const batchCount = await Batch.countDocuments({ course: course._id });
    const studentCount = await Student.countDocuments({ course: course._id });

    return sendSuccess({
      req,
      res,
      message: 'Course retrieved successfully',
      data: {
        ...course.toObject(),
        batchCount,
        studentCount,
      },
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ─── Update Course (Admin / Board only) ───────────────────────────────────────
export const updateCourse = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const validatedData = courseUpdateSchema.parse(req.body);

    const course = await Course.findById(courseId);
    if (!course) {
      return sendError({ req, res, statusCode: 404, message: 'Course not found' });
    }

    // Check for duplicate course name (excluding current course)
    if (validatedData.name) {
      const existingCourse = await Course.findOne({
        _id: { $ne: courseId },
        name: { $regex: new RegExp(`^${validatedData.name}$`, 'i') }
      });
      if (existingCourse) {
        return sendError({ req, res, statusCode: 400, message: 'A course with this name already exists in the centralized catalog.' });
      }
    }

    if (validatedData.examinations && Array.isArray(validatedData.examinations)) {
      if (!validatedData.subjects || validatedData.subjects.length === 0) {
        const flatSubs: string[] = [];
        validatedData.examinations.forEach(s => {
          (s.subjects || []).forEach(sub => {
            if (sub.name) {
              flatSubs.push(sub.code ? `${sub.code}: ${sub.name}` : sub.name);
            }
          });
        });
        validatedData.subjects = flatSubs;
      }
      if (!validatedData.practicalExams || validatedData.practicalExams.length === 0) {
        const flatPracs: string[] = [];
        validatedData.examinations.forEach(s => {
          (s.practicalExams || []).forEach(prac => {
            if (prac.name) {
              flatPracs.push(prac.code ? `${prac.code}: ${prac.name}` : prac.name);
            }
          });
        });
        validatedData.practicalExams = flatPracs;
      }
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { $set: validatedData },
      { new: true, runValidators: true }
    );

    return sendSuccess({
      req,
      res,
      message: 'Course updated successfully',
      data: updatedCourse,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) throw error;
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ─── Delete Course (Admin / Board only) ───────────────────────────────────────
export const deleteCourse = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return sendError({ req, res, statusCode: 404, message: 'Course not found' });
    }

    // Check if there are students enrolled in this course across any institute
    const studentCount = await Student.countDocuments({ course: courseId });
    if (studentCount > 0) {
      return sendError({
        req,
        res,
        statusCode: 400,
        message: `Cannot delete course. ${studentCount} student(s) are currently enrolled in this course across institutes. Deactivate the course instead.`
      });
    }

    // Check if there are batches associated with this course
    const batchCount = await Batch.countDocuments({ course: courseId });
    if (batchCount > 0) {
      return sendError({
        req,
        res,
        statusCode: 400,
        message: `Cannot delete course. ${batchCount} batch(es) are associated with this course across institutes.`
      });
    }

    await Course.findByIdAndDelete(courseId);

    return sendSuccess({
      req,
      res,
      message: 'Course deleted successfully',
      data: { deletedId: courseId },
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ==========================================
// BATCH CRUD OPERATIONS
// ==========================================

// ─── Create Batch ─────────────────────────────────────────────────────────────
export const createBatch = async (req: Request, res: Response) => {
  try {
    const validatedData = batchCreateSchema.parse(req.body);

    const institute = await Institute.findOne({ user: req.user._id, status: 'Approved' });
    if (!institute) {
      return sendError({ req, res, statusCode: 403, message: 'Access Denied: Your institute application is not approved yet.' });
    }

    // Verify course exists in centralized catalog
    const course = await Course.findById(validatedData.courseId);
    if (!course) {
      return sendError({ req, res, statusCode: 404, message: 'Course not found in the centralized academic catalog.' });
    }

    if (course.status !== 'Active') {
      return sendError({ req, res, statusCode: 400, message: 'Cannot create a batch for an Inactive course.' });
    }

    // Automated Batch Naming Convention
    // Standard Naming: e.g. DEM-2026-A or FEM-2026-A based on course code/prefix + Year + Batch letter
    const coursePrefix = (course.courseCode || course.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 4)).toUpperCase();
    const existingBatchesForYear = await Batch.find({
      institute: institute._id,
      course: course._id,
      year: validatedData.year,
    }).sort({ createdAt: 1 });

    const batchIndex = existingBatchesForYear.length;
    const batchLetter = String.fromCharCode(65 + (batchIndex % 26)) + (batchIndex >= 26 ? String(Math.floor(batchIndex / 26)) : '');
    const generatedBatchName = `${coursePrefix}-${validatedData.year}-Batch ${batchLetter}`;

    const finalBatchName = validatedData.name?.trim() ? validatedData.name.trim() : generatedBatchName;

    // Check duplicate
    const duplicateBatch = await Batch.findOne({
      institute: institute._id,
      course: course._id,
      name: { $regex: new RegExp(`^${finalBatchName}$`, 'i') },
    });
    if (duplicateBatch) {
      return sendError({ req, res, statusCode: 400, message: `Duplicate batch: A batch with the name "${finalBatchName}" already exists for this course and year.` });
    }

    // Authoritative batch capacity fixed by Academic Board (intake quota)
    const boardFixedSeats = institute.approvedSeats || institute.seatsRequested || 5;

    const newBatch = await Batch.create({
      institute: institute._id,
      course: course._id,
      year: validatedData.year,
      name: finalBatchName,
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : new Date(`${validatedData.year}-01-10`),
      seats: boardFixedSeats,
      activeFellows: 0,
      status: 'Active',
    });

    return sendSuccess({
      req,
      res,
      statusCode: 201,
      message: 'Batch created successfully with standardized naming convention',
      data: newBatch,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) throw error;
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ─── Get All Batches ──────────────────────────────────────────────────────────
export const getBatches = async (req: Request, res: Response) => {
  try {
    const query: any = {};
    if (req.user.role === 'institute') {
      const institute = await Institute.findOne({ user: req.user._id, status: 'Approved' });
      if (!institute) {
        return sendError({ req, res, statusCode: 403, message: 'Access Denied: Your institute application is not approved yet.' });
      }
      query.institute = institute._id;
    }

    // Populate course details
    const batches = await Batch.find(query)
      .populate('course', 'name courseCode courseType courseDuration durationType')
      .sort({ year: -1, createdAt: -1 });

    return sendSuccess({ req, res, message: 'Batches retrieved successfully', data: batches });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ─── Get Single Batch ─────────────────────────────────────────────────────────
export const getBatchById = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const query: any = { _id: batchId };

    if (req.user.role === 'institute') {
      const institute = await Institute.findOne({ user: req.user._id, status: 'Approved' });
      if (!institute) {
        return sendError({ req, res, statusCode: 403, message: 'Access Denied: Your institute application is not approved yet.' });
      }
      query.institute = institute._id;
    }

    const batch = await Batch.findOne(query).populate('course', 'name courseCode courseType courseDuration durationType');
    if (!batch) {
      return sendError({ req, res, statusCode: 404, message: 'Batch not found' });
    }

    // Get student count for this batch
    const studentCount = await Student.countDocuments({ batch: batch._id });

    return sendSuccess({
      req,
      res,
      message: 'Batch retrieved successfully',
      data: {
        ...batch.toObject(),
        studentCount,
      },
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ─── Update Batch ─────────────────────────────────────────────────────────────
export const updateBatch = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const validatedData = batchUpdateSchema.parse(req.body);

    const institute = await Institute.findOne({ user: req.user._id, status: 'Approved' });
    if (!institute) {
      return sendError({ req, res, statusCode: 403, message: 'Access Denied: Your institute application is not approved yet.' });
    }

    const batch = await Batch.findOne({ _id: batchId, institute: institute._id });
    if (!batch) {
      return sendError({ req, res, statusCode: 404, message: 'Batch not found or does not belong to your institute' });
    }

    // If updating name, check for duplicates
    if (validatedData.name) {
      const duplicateBatch = await Batch.findOne({
        _id: { $ne: batchId },
        institute: institute._id,
        course: batch.course,
        name: { $regex: new RegExp(`^${validatedData.name}$`, 'i') },
      });
      if (duplicateBatch) {
        return sendError({ req, res, statusCode: 400, message: `A batch with the name "${validatedData.name}" already exists for this course.` });
      }
    }

    const updatedBatch = await Batch.findByIdAndUpdate(
      batchId,
      { $set: validatedData },
      { new: true, runValidators: true }
    ).populate('course', 'name courseCode');

    return sendSuccess({
      req,
      res,
      message: 'Batch updated successfully',
      data: updatedBatch,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) throw error;
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ─── Delete Batch ─────────────────────────────────────────────────────────────
export const deleteBatch = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;

    const institute = await Institute.findOne({ user: req.user._id, status: 'Approved' });
    if (!institute) {
      return sendError({ req, res, statusCode: 403, message: 'Access Denied: Your institute application is not approved yet.' });
    }

    const batch = await Batch.findOne({ _id: batchId, institute: institute._id });
    if (!batch) {
      return sendError({ req, res, statusCode: 404, message: 'Batch not found or does not belong to your institute' });
    }

    // Check if there are students in this batch
    const studentCount = await Student.countDocuments({ batch: batchId });
    if (studentCount > 0) {
      return sendError({
        req,
        res,
        statusCode: 400,
        message: `Cannot delete batch. ${studentCount} student(s) are currently in this batch. Please transfer or de-enroll them first.`
      });
    }

    await Batch.findByIdAndDelete(batchId);

    return sendSuccess({
      req,
      res,
      message: 'Batch deleted successfully',
      data: { deletedId: batchId },
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ─── Get Batches by Course ────────────────────────────────────────────────────
export const getBatchesByCourse = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    const institute = await Institute.findOne({ user: req.user._id, status: 'Approved' });
    if (!institute) {
      return sendError({ req, res, statusCode: 403, message: 'Access Denied: Your institute application is not approved yet.' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return sendError({ req, res, statusCode: 404, message: 'Course not found' });
    }

    const batches = await Batch.find({ course: courseId, institute: institute._id })
      .sort({ year: -1 });

    return sendSuccess({
      req,
      res,
      message: 'Batches retrieved successfully',
      data: batches,
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ==========================================
// STUDENT MANAGEMENT (Existing)
// ==========================================

// Pre-payment duplicate check: verify that a student with the given email or
// medical council registration number does NOT already exist before the user
// is allowed to pay the enrollment fee.
export const checkStudentExists = async (req: Request, res: Response) => {
  try {
    const { email, medicalCouncilRegistrationNumber } = req.body;

    if (!email && !medicalCouncilRegistrationNumber) {
      return sendError({ req, res, statusCode: 400, message: 'Email or Medical Council Registration Number is required' });
    }

    const query: any[] = [];
    if (email) query.push({ email: String(email).trim() });
    if (medicalCouncilRegistrationNumber) {
      query.push({ medicalCouncilRegistrationNumber: String(medicalCouncilRegistrationNumber).trim() });
    }

    const existingStudent = query.length > 0
      ? await Student.findOne({ $or: query })
      : null;

    return sendSuccess({
      req,
      res,
      statusCode: 200,
      message: existingStudent
        ? 'A student with this Email Address or Medical Council Registration Number already exists in the system.'
        : 'No existing student found',
      data: { exists: !!existingStudent },
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const addStudent = async (req: Request, res: Response) => {
  try {
    const validatedData = studentAddSchema.parse(req.body);

    const institute = await Institute.findOne({ user: req.user._id, status: 'Approved' });
    if (!institute) {
      return sendError({ req, res, statusCode: 403, message: 'Access Denied: Your institute application is not approved yet.' });
    }

    // Idempotency check: prevent duplicate payment processing
    if (validatedData.razorpayPaymentId) {
      const existingPayment = await Student.findOne({ razorpayPaymentId: validatedData.razorpayPaymentId });
      if (existingPayment) {
        return sendError({
          req,
          res,
          statusCode: 400,
          message: 'Payment already processed and recorded for this student enrollment.',
        });
      }
    }

    const course = await Course.findById(validatedData.courseId);
    if (!course) {
      return sendError({ req, res, statusCode: 404, message: 'Specified Course does not exist in the academic catalog.' });
    }

    const batch = await Batch.findOne({ _id: validatedData.batchId, course: course._id });
    if (!batch) {
      return sendError({ req, res, statusCode: 404, message: 'Specified Batch does not exist under this course.' });
    }

    const existingStudent = await Student.findOne({
      $or: [
        { email: validatedData.email },
        { medicalCouncilRegistrationNumber: validatedData.medicalCouncilRegistrationNumber }
      ]
    });
    if (existingStudent) {
      return sendError({ 
        req, 
        res, 
        statusCode: 400, 
        message: 'Warning: A student with this Email Address or Medical Council Registration Number already exists in the system.' 
      });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const requiredDocFields = [
      'passportPhoto', 'mbbsCertificate', 'medicalCouncilRegistrationCertificate',
      'semiMembershipForm'
    ];

    for (const field of requiredDocFields) {
      if (!files || !files[field] || files[field].length === 0) {
        return sendError({ req, res, statusCode: 400, message: `Missing mandatory document upload: ${field}` });
      }
    }

    if (validatedData.isForeignGraduate) {
      if (validatedData.fmgeClearanceStatus !== 'Cleared') {
        return sendError({ req, res, statusCode: 400, message: 'FMGE clearance is mandatory for foreign medical graduates.' });
      }
      if (!files || !files['fmgeResultCopy'] || files['fmgeResultCopy'].length === 0) {
        return sendError({ req, res, statusCode: 400, message: 'Missing mandatory document upload: fmgeResultCopy' });
      }
    }

    let enrollmentId = '';
    let isUnique = false;
    while (!isUnique) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      enrollmentId = `SEMI-${batch.year}-${randomSuffix}`;
      const existingEnrollment = await Student.findOne({ enrollmentId });
      if (!existingEnrollment) {
        isUnique = true;
      }
    }

    const examinations = [
      {
        examinationNumber: 1,
        attendancePercentage: 0,
        thesisApproved: false,
        eligibilityStatus: 'Pending' as const,
      },
      {
        examinationNumber: 2,
        attendancePercentage: 0,
        thesisApproved: false,
        eligibilityStatus: 'Pending' as const,
      },
    ];

    const student = await Student.create({
      enrollmentId,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      homeAddress: validatedData.homeAddress,
      contactNumber: validatedData.contactNumber,
      email: validatedData.email,
      dateOfBirth: validatedData.dateOfBirth,
      qualification: validatedData.qualification,
      mbbsQualification: validatedData.mbbsQualification,
      yearOfPassing: validatedData.yearOfPassing,
      universityName: validatedData.universityName,
      medicalCouncilRegistrationNumber: validatedData.medicalCouncilRegistrationNumber,
      isForeignGraduate: validatedData.isForeignGraduate,
      fmgeClearanceStatus: validatedData.fmgeClearanceStatus,
      course: course._id,
      batch: batch._id,
      institute: institute._id,
      courseDirector: validatedData.courseDirector,
      razorpayOrderId: validatedData.razorpayOrderId,
      razorpayPaymentId: validatedData.razorpayPaymentId,
      razorpaySignature: validatedData.razorpaySignature,
      documents: {
        passportPhotoUrl: getFileUrl(files['passportPhoto'][0].path),
        mbbsCertificateUrl: getFileUrl(files['mbbsCertificate'][0].path),
        medicalCouncilRegistrationCertificateUrl: getFileUrl(files['medicalCouncilRegistrationCertificate'][0].path),
        fmgeResultCopyUrl: files['fmgeResultCopy'] ? getFileUrl(files['fmgeResultCopy'][0].path) : undefined,
        semiMembershipFormUrl: getFileUrl(files['semiMembershipForm'][0].path),
        studentSignatureUrl: files['studentSignature'] ? getFileUrl(files['studentSignature'][0].path) : undefined,
        hodSignatureUrl: files['hodSignature'] ? getFileUrl(files['hodSignature'][0].path) : undefined,
      },
      remittedToAcademy: false,
      examinations,
    });

    // Update batch active fellows count
    await Batch.findByIdAndUpdate(batch._id, { $inc: { activeFellows: 1 } });

    // Create FeeRecord for enrollment fee
    await FeeRecord.create({
      student: student._id,
      amount: 140000,
      paymentMode: validatedData.paymentMode || 'Razorpay Online',
      utrNumber: validatedData.razorpayPaymentId || 'razorpay-online',
      paymentReceiptUrl: 'Online Verification',
      paymentDate: validatedData.paymentDate ? new Date(validatedData.paymentDate) : new Date(),
      paymentPurpose: 'Enrollment fee',
      razorpayOrderId: validatedData.razorpayOrderId,
      razorpayPaymentId: validatedData.razorpayPaymentId,
      razorpaySignature: validatedData.razorpaySignature,
    });

    return sendSuccess({
      req,
      res,
      statusCode: 201,
      message: 'Student registered successfully',
      data: student,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('Zod Validation Error:', error.issues);
      require('fs').writeFileSync('last_error.log', JSON.stringify(error.issues, null, 2));
      return sendError({ req, res, statusCode: 400, message: 'Validation Error: ' + JSON.stringify(error.issues) });
    }
    console.error('Error in addStudent:', error);
    require('fs').writeFileSync('last_error.log', String(error.message));
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ==========================================
// FEE RECORDING (Existing)
// ==========================================

export const recordStudentFee = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const validatedData = feeRecordSchema.parse(req.body);

    const institute = await Institute.findOne({ user: req.user._id, status: 'Approved' });
    if (!institute) {
      return sendError({ req, res, statusCode: 403, message: 'Access Denied: Your institute application is not approved yet.' });
    }

    const student = await Student.findOne({ _id: studentId, institute: institute._id });
    if (!student) {
      return sendError({ req, res, statusCode: 404, message: 'Student not found under this institute' });
    }

    // Exam fee eligibility guard: an exam fee may only be collected when the
    // configured fee is actually applicable (waived for first attempt unless
    // opted-in; removed for reappearing when the fee is set to 0).
    const isExamFeePurpose =
      String(validatedData.paymentPurpose).toLowerCase().includes('exam');
    if (isExamFeePurpose) {
      const course = student.course || await Course.findById(
        (student as any).courseId || (student as any).course
      );
      const status = await checkStudentReappearance(String(student._id), validatedData.examinationNumber);
      const feeConfig = course
        ? resolveFeeConfiguration(course, validatedData.examinationNumber)
        : { firstAttemptFee: 0, reappearingFee: 0, feeApplicableForFirstAttempt: false };

      const feeApplicable = status.isReappearing
        ? feeConfig.reappearingFee > 0
        : feeConfig.feeApplicableForFirstAttempt && feeConfig.firstAttemptFee > 0;

      if (!feeApplicable) {
        return sendError({
          req,
          res,
          statusCode: 422,
          message: status.isReappearing
            ? 'Exam fee has been waived for reappearing students for this course/examination. Payment cannot be recorded.'
            : 'Exam fee is waived for first-attempt students for this course/examination. Payment cannot be recorded.',
        });
      }
    }

    const feeRecord = await FeeRecord.create({
      student: student._id,
      examinationNumber: validatedData.examinationNumber,
      amount: validatedData.amount,
      paymentMode: validatedData.paymentMode || 'Razorpay Online',
      utrNumber: validatedData.razorpayPaymentId || validatedData.utrNumber,
      paymentReceiptUrl: 'Online Verification',
      paymentDate: validatedData.paymentDate,
      paymentPurpose: validatedData.paymentPurpose,
      razorpayOrderId: validatedData.razorpayOrderId,
      razorpayPaymentId: validatedData.razorpayPaymentId,
      razorpaySignature: validatedData.razorpaySignature,
    });

    return sendSuccess({
      req,
      res,
      statusCode: 201,
      message: 'Fee payment transaction recorded successfully',
      data: feeRecord,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) throw error;
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const listFeeRecords = async (req: Request, res: Response) => {
  try {
    const query: any = {};

    if (req.user.role === 'institute') {
      const institute = await Institute.findOne({ user: req.user._id, status: 'Approved' });
      if (!institute) {
        return sendError({ req, res, statusCode: 403, message: 'Access Denied: Your institute application is not approved yet.' });
      }
      // Find student IDs that belong to this institute
      const studentIds = await Student.find({ institute: institute._id }).distinct('_id');
      query.student = { $in: studentIds };
    }

    const records = await FeeRecord.find(query)
      .populate({ path: 'student', select: 'firstName lastName enrollmentId email course batch institute', populate: { path: 'institute', select: 'orgName' } })
      .sort({ createdAt: -1 });

    // Enhance records with category and formatted data
    const enhancedRecords = records.map(record => {
      const recordObj = record.toObject();
      const student = recordObj.student as any;
      const category = getFeeCategory(recordObj.paymentPurpose);
      return {
        ...recordObj,
        category,
        categoryLabel: getFeeCategoryLabel(category),
        paymentPurpose: recordObj.paymentPurpose || 'Fee Payment',
        studentName: student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : 'N/A',
        studentEnrollmentId: student?.enrollmentId || 'N/A',
        instituteName: student?.institute?.orgName || 'N/A',
      };
    });

    return sendSuccess({
      req,
      res,
      message: 'Fee records retrieved successfully',
      data: enhancedRecords,
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ==========================================
// REMITTANCE (Existing)
// ==========================================

export const getPayableAmount = async (req: Request, res: Response) => {
  try {
    const institute = await Institute.findOne({ user: req.user._id, status: 'Approved' });
    if (!institute) {
      return sendError({ req, res, statusCode: 403, message: 'Access Denied: Your institute application is not approved yet.' });
    }

    const pendingStudents = await Student.find({ institute: institute._id, remittedToAcademy: false })
      .select('firstName lastName enrollmentId email');

    const ACADEMY_STUDENT_FEE = Number(process.env.STUDENT_REMITTANCE_FEE_INR) || 50000;
    const count = pendingStudents.length;
    const payableAmount = count * ACADEMY_STUDENT_FEE;

    return sendSuccess({
      req,
      res,
      message: 'Payable remittance calculated successfully',
      data: {
        pendingStudentCount: count,
        standardFeePerStudent: ACADEMY_STUDENT_FEE,
        payableAmount,
        pendingStudents,
      },
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const recordRemittance = async (req: Request, res: Response) => {
  try {
    const validatedData = remittanceSchema.parse(req.body);

    const institute = await Institute.findOne({ user: req.user._id, status: 'Approved' });
    if (!institute) {
      return sendError({ req, res, statusCode: 403, message: 'Access Denied: Your institute application is not approved yet.' });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const paymentReceiptFile = files && files['paymentReceipt'] && files['paymentReceipt'].length > 0 ? files['paymentReceipt'][0] : null;

    if (validatedData.razorpayPaymentId && validatedData.razorpayOrderId && validatedData.razorpaySignature) {
      if (isRazorpayConfigured && razorpayInstance && !validatedData.razorpayOrderId.startsWith('order_mock_')) {
        const generated_signature = crypto
          .createHmac('sha256', keySecret as string)
          .update(validatedData.razorpayOrderId + '|' + validatedData.razorpayPaymentId)
          .digest('hex');

        if (generated_signature !== validatedData.razorpaySignature) {
          return sendError({ req, res, statusCode: 400, message: 'Remittance Razorpay payment verification failed. Invalid signature.' });
        }
      }
    }

    let studentIdsToRemit = validatedData.studentIds;
    
    if (!studentIdsToRemit || studentIdsToRemit.length === 0) {
      const pendingStudents = await Student.find({ institute: institute._id, remittedToAcademy: false });
      studentIdsToRemit = pendingStudents.map((s) => s._id.toString());
    } else {
      const validatedStudentsCount = await Student.countDocuments({
        _id: { $in: studentIdsToRemit },
        institute: institute._id,
        remittedToAcademy: false,
      });

      if (validatedStudentsCount !== studentIdsToRemit.length) {
        return sendError({
          req,
          res,
          statusCode: 400,
          message: 'One or more specified students are invalid, do not belong to this institute, or are already remitted.',
        });
      }
    }

    if (studentIdsToRemit.length === 0) {
      return sendError({ req, res, statusCode: 400, message: 'No outstanding student remittances found to process.' });
    }

    const remittance = await Remittance.create({
      institute: institute._id,
      totalAmount: validatedData.totalAmount,
      paymentPurpose: validatedData.paymentPurpose || 'Student Fellowship Fee Remittance',
      remarks: validatedData.remarks || '',
      utrNumber: validatedData.razorpayPaymentId || validatedData.utrNumber || `REM-${Date.now()}`,
      razorpayOrderId: validatedData.razorpayOrderId || '',
      razorpayPaymentId: validatedData.razorpayPaymentId || '',
      razorpaySignature: validatedData.razorpaySignature || '',
      paymentMode: validatedData.paymentMode || 'Razorpay Online',
      paymentDate: validatedData.paymentDate || new Date(),
      paymentReceiptUrl: paymentReceiptFile ? getFileUrl(paymentReceiptFile.path) : 'Razorpay Verified',
      students: studentIdsToRemit,
    });

    await Student.updateMany(
      { _id: { $in: studentIdsToRemit } },
      { $set: { remittedToAcademy: true, remittanceRecord: remittance._id } }
    );

    return sendSuccess({
      req,
      res,
      statusCode: 201,
      message: 'Academy remittance transaction successfully recorded',
      data: remittance,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) throw error;
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ==========================================
// ELIGIBILITY ENGINE (Existing)
// ==========================================

const studentMetricsUpdateSchema = z.object({
  examinationNumber: z.coerce.number().min(1, 'Examination Number is required').max(2),
  attendancePercentage: z.coerce.number().min(0).max(100, 'Attendance must be between 0 and 100').optional(),
  thesisApproved: z.preprocess(
    (val) => val === 'true' || val === true || val === '1',
    z.boolean()
  ).optional(),
  clearThesis: z.preprocess((val) => val === 'true' || val === true || val === '1', z.boolean()).optional(),
  clearAttendance: z.preprocess((val) => val === 'true' || val === true || val === '1', z.boolean()).optional(),
  eligibilityStatus: z.enum(['Pending', 'Approved', 'Rejected']).optional(),
  rejectionNotes: z.string().optional(),
});

export const listStudents = async (req: Request, res: Response) => {
  try {
    const { courseId, batchId, search, isEligible, examinationNumber, verificationStatus, instituteId } = req.query;
    const query: any = {};

    if (req.user.role === 'institute') {
      const institute = await Institute.findOne({ user: req.user._id, status: 'Approved' });
      if (!institute) {
        return sendError({ req, res, statusCode: 403, message: 'Access Denied: Your institute application is not approved yet.' });
      }
      query.institute = institute._id;
    } else if (instituteId) {
      query.institute = instituteId;
    }

    if (verificationStatus) {
      query.verificationStatus = verificationStatus;
    }

    if (courseId) {
      query.course = courseId;
    }
    if (batchId) {
      query.batch = batchId;
    }
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { enrollmentId: { $regex: search, $options: 'i' } },
        { medicalCouncilRegistrationNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // We can't query nested array conditions perfectly with just isEligible if we don't have examinationNumber
    // but if we do have it:
    if (examinationNumber) {
      const examNum = parseInt(examinationNumber as string);
      if (isEligible === 'true') {
        query.examinations = {
          $elemMatch: {
            examinationNumber: examNum,
            attendancePercentage: { $gte: 75 },
            thesisApproved: true
          }
        };
      } else if (isEligible === 'false') {
        query.examinations = {
          $elemMatch: {
            examinationNumber: examNum,
            $or: [
              { attendancePercentage: { $lt: 75 } },
              { thesisApproved: false },
            ]
          }
        };
      }
    }

    const students = await Student.find(query)
      .populate('course', 'name')
      .populate('batch', 'year')
      .populate('institute', 'orgName')
      .sort({ createdAt: -1 });

    const formattedStudents = students.map((student) => {
      const sObj: any = student.toObject();
      const sExaminations = sObj.examinations || [];
      const latestExam = sExaminations.length > 0 ? sExaminations[sExaminations.length - 1] : null;

      const attendancePct = (sObj.attendancePercentage !== undefined && sObj.attendancePercentage !== null && sObj.attendancePercentage > 0)
        ? sObj.attendancePercentage
        : (latestExam && latestExam.attendancePercentage !== undefined ? latestExam.attendancePercentage : 0);

      const isThesisApproved = Boolean(sObj.thesisApproved || sExaminations.some((sem: any) => sem.thesisApproved));
      const isThesisUploaded = Boolean(sExaminations.some((sem: any) => sem.thesisDocumentUrl));
      const isRemitted = Boolean(sObj.remittedToAcademy || sObj.razorpayPaymentId);

      let isStudentEligible = false;
      if (examinationNumber) {
        const sem = sExaminations.find((s: any) => s.examinationNumber === parseInt(examinationNumber as string));
        if (sem) {
          isStudentEligible = sem.attendancePercentage >= 75 && sem.thesisApproved;
        }
      } else {
        isStudentEligible = isRemitted && attendancePct >= 75 && (isThesisApproved || isThesisUploaded);
      }

      return {
        ...sObj,
        attendancePercentage: attendancePct,
        thesisApproved: isThesisApproved,
        thesisUploaded: isThesisUploaded,
        remittedToAcademy: isRemitted,
        isEligible: isStudentEligible,
      };
    });

    return sendSuccess({
      req,
      res,
      message: 'Students list retrieved successfully',
      data: formattedStudents,
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const updateAcademicMetrics = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const validatedData = studentMetricsUpdateSchema.parse(req.body);
    const query: any = { _id: studentId };

    if (req.user.role === 'institute') {
      const institute = await Institute.findOne({ user: req.user._id, status: 'Approved' });
      if (!institute) {
        return sendError({ req, res, statusCode: 403, message: 'Access Denied: Your institute application is not approved yet.' });
      }
      query.institute = institute._id;
    }

    const student = await Student.findOne(query);
    if (!student) {
      return sendError({ req, res, statusCode: 404, message: 'Student not found or unauthorized' });
    }

    const examinationIndex = student.examinations.findIndex(s => s.examinationNumber === validatedData.examinationNumber);
    if (examinationIndex === -1) {
      return sendError({ req, res, statusCode: 404, message: 'Examination not found for this student' });
    }

    if (validatedData.clearAttendance) {
      student.examinations[examinationIndex].attendancePercentage = 0;
    } else if (validatedData.attendancePercentage !== undefined) {
      student.examinations[examinationIndex].attendancePercentage = validatedData.attendancePercentage;
    }
    
    if (validatedData.clearThesis) {
      student.examinations[examinationIndex].thesisApproved = false;
      student.examinations[examinationIndex].thesisDocumentUrl = undefined;
    } else if (validatedData.thesisApproved !== undefined) {
      student.examinations[examinationIndex].thesisApproved = validatedData.thesisApproved;
    }

    if (!validatedData.clearThesis && req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (files['thesisDocument'] && files['thesisDocument'].length > 0) {
        student.examinations[examinationIndex].thesisDocumentUrl = getFileUrl(files['thesisDocument'][0].path);
      }
    }

    if (validatedData.eligibilityStatus) {
      student.examinations[examinationIndex].eligibilityStatus = validatedData.eligibilityStatus;
      if (validatedData.rejectionNotes) {
        (student.examinations[examinationIndex] as any).rejectionNotes = validatedData.rejectionNotes;
      }
    }

    await student.save();

    const isStudentEligible = student.examinations[examinationIndex].attendancePercentage >= 75 && student.examinations[examinationIndex].thesisApproved;

    return sendSuccess({
      req,
      res,
      message: 'Student academic metrics updated successfully',
      data: {
        ...student.toObject(),
        isEligible: isStudentEligible,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) throw error;
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const evaluateEligibility = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { examinationNumber } = req.query;
    const query: any = { _id: studentId };

    if (!examinationNumber) {
      return sendError({ req, res, statusCode: 400, message: 'Examination Number is required to evaluate eligibility' });
    }

    if (req.user.role === 'institute') {
      const institute = await Institute.findOne({ user: req.user._id, status: 'Approved' });
      if (!institute) {
        return sendError({ req, res, statusCode: 403, message: 'Access Denied: Your institute application is not approved yet.' });
      }
      query.institute = institute._id;
    }

    const student = await Student.findOne(query)
      .populate('course', 'name')
      .populate('batch', 'year');
    if (!student) {
      return sendError({ req, res, statusCode: 404, message: 'Student not found or unauthorized' });
    }

    const examNum = parseInt(examinationNumber as string);
    const examRecord = student.examinations.find(s => s.examinationNumber === examNum);
    
    if (!examRecord) {
      return sendError({ req, res, statusCode: 404, message: 'Examination record not found for this student' });
    }

    // Check fee record for this student and examination
    const feeRecord = await FeeRecord.findOne({ student: student._id, examinationNumber: examNum, paymentPurpose: 'Examination fee' });
    const courseDoc = student.course as any;
    const courseForFee = await Course.findById(courseDoc?._id || courseDoc);

    // Fee eligibility check only applies when a fee is actually set for this
    // course/examination or the student is reappearing:
    // - reappearing students pay when a reappearing fee is configured (> 0);
    // - first-attempt students pay only when the course opts in with a fee > 0.
    const feeConfig = courseForFee
      ? resolveFeeConfiguration(courseForFee, examNum)
      : { firstAttemptFee: 0, reappearingFee: 0, feeApplicableForFirstAttempt: false };

    const priorResults = await Result.find({
      student: student._id,
      examination: examNum,
      isPublished: true,
    }).sort({ createdAt: -1 });
    const latestResult = priorResults[0];
    const isReappearing = !!latestResult && (
      latestResult.resultStatus === 'FAIL' ||
      latestResult.resultStatus === 'SUPPLEMENTARY' ||
      latestResult.resultStatus === 'REVALUATION_PENDING'
    );

    const feeRequired = isReappearing
      ? feeConfig.reappearingFee > 0
      : feeConfig.feeApplicableForFirstAttempt && feeConfig.firstAttemptFee > 0;
    const feeStatus = {
      status: !feeRequired ? 'Waived' : feeRecord ? 'Paid' : 'Pending',
      isValid: !feeRequired || !!feeRecord,
      isReappearing,
      feeApplicable: feeRequired,
      description: !feeRequired
        ? isReappearing
          ? 'Exam fee is waived for this student (no reappearing fee is set for this examination).'
          : 'Exam fee is waived for this student (first attempt).'
        : feeRecord
          ? 'Exam fee payment has been verified for this examination.'
          : 'Exam fee payment is required but has not been recorded.',
    };

    const checklist = {
      feeStatus,
      attendance: {
        value: examRecord.attendancePercentage,
        threshold: 75,
        isValid: examRecord.attendancePercentage >= 75,
        description: examRecord.attendancePercentage >= 75
          ? `Attendance is ${examRecord.attendancePercentage}%, which meets the minimum 75% requirement.`
          : `Attendance is ${examRecord.attendancePercentage}%, which is below the minimum 75% requirement.`,
      },
      thesisApproval: {
        status: examRecord.thesisApproved ? 'Approved' : 'Pending',
        isValid: examRecord.thesisApproved,
        description: examRecord.thesisApproved
          ? 'Thesis evaluation has been approved by the board.'
          : 'Thesis submission is pending approval or has not been approved.',
      },
      courseCertificates: {
        status: (student.documents?.nblsCertificateUrl || student.documents?.nclsCertificateUrl || student.documents?.ntlsCertificateUrl || student.documents?.nulsCertificateUrl) ? 'Completed' : 'Incomplete',
        isValid: !!(student.documents?.nblsCertificateUrl || student.documents?.nclsCertificateUrl || student.documents?.ntlsCertificateUrl || student.documents?.nulsCertificateUrl),
        nbls: !!student.documents?.nblsCertificateUrl,
        ncls: !!student.documents?.nclsCertificateUrl,
        ntls: !!student.documents?.ntlsCertificateUrl,
        nuls: !!student.documents?.nulsCertificateUrl,
        description: (student.documents?.nblsCertificateUrl || student.documents?.nclsCertificateUrl || student.documents?.ntlsCertificateUrl || student.documents?.nulsCertificateUrl)
          ? 'Mandatory course completion certificate (NBLS/NCLS/NTLS/NULS) is uploaded.'
          : 'Missing mandatory course completion certificate (at least one of NBLS, NCLS, NTLS, NULS required before exam).',
      },
    };

    const isEligible = checklist.feeStatus.isValid && checklist.attendance.isValid && checklist.thesisApproval.isValid && checklist.courseCertificates.isValid;

    return sendSuccess({
      req,
      res,
      message: 'Student eligibility evaluated successfully',
      data: {
        student: {
          id: student._id,
          enrollmentId: student.enrollmentId,
          firstName: student.firstName,
          lastName: student.lastName,
          course: student.course,
          batch: student.batch,
        },
        checklist,
        isEligible,
        decision: isEligible ? 'Eligible' : 'Not Eligible',
      },
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const getRemittances = async (req: Request, res: Response) => {
  try {
    const query: any = {};
    if (req.user.role === 'institute') {
      const institute = await Institute.findOne({ user: req.user._id, status: 'Approved' });
      if (!institute) {
        return sendError({ req, res, statusCode: 403, message: 'Access Denied: Your institute application is not approved yet.' });
      }
      query.institute = institute._id;
    }

    const remittances = await Remittance.find(query)
      .populate('institute', 'orgName')
      .populate('students', 'firstName lastName enrollmentId')
      .sort({ createdAt: -1 });

    return sendSuccess({
      req,
      res,
      message: 'Remittances retrieved successfully',
      data: remittances,
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const getStudentById = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { examinationNumber } = req.query;
    const query: any = { _id: studentId };

    if (req.user.role === 'institute') {
      const institute = await Institute.findOne({ user: req.user._id, status: 'Approved' });
      if (!institute) {
        return sendError({ req, res, statusCode: 403, message: 'Access Denied: Your institute application is not approved yet.' });
      }
      query.institute = institute._id;
    }

    const student = await Student.findOne(query)
      .populate('course', 'name')
      .populate('batch', 'year')
      .populate('institute', 'orgName');

    if (!student) {
      return sendError({ req, res, statusCode: 404, message: 'Student not found or unauthorized' });
    }

    let isStudentEligible = false;
    if (examinationNumber) {
      const sem = student.examinations.find(s => s.examinationNumber === parseInt(examinationNumber as string));
      if (sem) {
        isStudentEligible = sem.attendancePercentage >= 75 && sem.thesisApproved;
      }
    }

    const formattedStudent = {
      ...student.toObject(),
      isEligible: isStudentEligible,
    };

    return sendSuccess({
      req,
      res,
      message: 'Student retrieved successfully',
      data: formattedStudent,
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const updateStudent = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const validatedData = studentUpdateSchema.parse(req.body);

    const query: any = { _id: studentId };

    if (req.user.role === 'institute') {
      const institute = await Institute.findOne({ user: req.user._id, status: 'Approved' });
      if (!institute) {
        return sendError({ req, res, statusCode: 403, message: 'Access Denied: Your institute application is not approved yet.' });
      }
      query.institute = institute._id;
    }

    const student = await Student.findOne(query);
    if (!student) {
      return sendError({ req, res, statusCode: 404, message: 'Student not found or unauthorized' });
    }

    // Verify course if updated
    if (validatedData.courseId) {
      const course = await Course.findById(validatedData.courseId);
      if (!course) {
        return sendError({ req, res, statusCode: 404, message: 'Specified Course does not exist.' });
      }
      student.course = course._id;
    }

    // Verify batch if updated
    if (validatedData.batchId) {
      const batch = await Batch.findById(validatedData.batchId);
      if (!batch) {
        return sendError({ req, res, statusCode: 404, message: 'Specified Batch does not exist.' });
      }
      // If batch is changing, update activeFellows count in old and new batches
      if (student.batch.toString() !== batch._id.toString()) {
        await Batch.findByIdAndUpdate(student.batch, { $inc: { activeFellows: -1 } });
        await Batch.findByIdAndUpdate(batch._id, { $inc: { activeFellows: 1 } });
        student.batch = batch._id;
      }
    }

    // Update other fields
    if (validatedData.firstName) student.firstName = validatedData.firstName;
    if (validatedData.lastName) student.lastName = validatedData.lastName;
    if (validatedData.homeAddress) student.homeAddress = validatedData.homeAddress;
    if (validatedData.contactNumber) student.contactNumber = validatedData.contactNumber;
    if (validatedData.email) student.email = validatedData.email;
    if (validatedData.qualification) student.qualification = validatedData.qualification;
    if (validatedData.mbbsQualification) student.mbbsQualification = validatedData.mbbsQualification;
    if (validatedData.yearOfPassing) student.yearOfPassing = validatedData.yearOfPassing;
    if (validatedData.universityName) student.universityName = validatedData.universityName;
    if (validatedData.medicalCouncilRegistrationNumber) student.medicalCouncilRegistrationNumber = validatedData.medicalCouncilRegistrationNumber;
    if (validatedData.isForeignGraduate !== undefined) student.isForeignGraduate = validatedData.isForeignGraduate;
    if (validatedData.fmgeClearanceStatus) student.fmgeClearanceStatus = validatedData.fmgeClearanceStatus;
    if (validatedData.courseDirector) student.courseDirector = validatedData.courseDirector;
    if (validatedData.razorpayOrderId) student.razorpayOrderId = validatedData.razorpayOrderId;
    if (validatedData.razorpayPaymentId) student.razorpayPaymentId = validatedData.razorpayPaymentId;
    if (validatedData.razorpaySignature) student.razorpaySignature = validatedData.razorpaySignature;

    // Handle files if uploaded
    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const docFields = [
        'passportPhoto', 'mbbsCertificate', 'medicalCouncilRegistrationCertificate',
        'fmgeResultCopy', 'semiMembershipForm', 'studentSignature', 'hodSignature',
        'nblsCertificate', 'nclsCertificate', 'ntlsCertificate', 'nulsCertificate'
      ];
      
      const newDocs: any = { ...student.documents };
      for (const field of docFields) {
        if (files && files[field] && files[field].length > 0) {
          newDocs[`${field}Url`] = getFileUrl(files[field][0].path);
        }
      }
      student.documents = newDocs;
    }

    // If an institute updates/resubmits details for a student flagged with Correction Required, reset to Pending Verification
    if (student.verificationStatus === 'Correction Required' && req.user.role === 'institute') {
      student.verificationStatus = 'Pending Verification';
      student.correctionResubmittedAt = new Date();
    }

    await student.save();

    const latestExamination = student.examinations?.[student.examinations.length - 1];
    const isStudentEligible = latestExamination ? (latestExamination.attendancePercentage >= 75 && latestExamination.thesisApproved) : false;

    // Fetch updated student with populate
    const updatedStudent = await Student.findById(student._id)
      .populate('course', 'name')
      .populate('batch', 'year')
      .populate('institute', 'orgName instituteAddress phoneNumber emailAddress headName hodName')
      .populate('verifiedBy', 'name email role');

    const formattedStudent = {
      ...updatedStudent?.toObject(),
      isEligible: isStudentEligible,
    };

    return sendSuccess({
      req,
      res,
      message: 'Student updated successfully',
      data: formattedStudent,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) throw error;
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const query: any = { _id: studentId };

    if (req.user.role === 'institute') {
      const institute = await Institute.findOne({ user: req.user._id, status: 'Approved' });
      if (!institute) {
        return sendError({ req, res, statusCode: 403, message: 'Access Denied: Your institute application is not approved yet.' });
      }
      query.institute = institute._id;
    }

    const student = await Student.findOne(query);
    if (!student) {
      return sendError({ req, res, statusCode: 404, message: 'Student not found or unauthorized' });
    }

    // Decrement active fellows in batch
    if (student.batch) {
      await Batch.findByIdAndUpdate(student.batch, { $inc: { activeFellows: -1 } });
    }

    await Student.deleteOne({ _id: student._id });

    return sendSuccess({
      req,
      res,
      message: 'Student deleted/de-enrolled successfully',
      data: { studentId },
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ==========================================
// PAYMENT CONTROLLERS (RAZORPAY)
// ==========================================

export const createRazorpayOrder = async (req: Request, res: Response) => {
  try {
    const { amount, purpose } = req.body;
    
    if (!amount || !purpose) {
      return sendError({ req, res, statusCode: 400, message: 'Amount and purpose are required' });
    }

    const AMOUNT_PAISE = Math.round(Number(amount) * 100);

    if (isRazorpayConfigured && razorpayInstance) {
      const options = {
        amount: AMOUNT_PAISE,
        currency: 'INR',
        receipt: `receipt_${purpose.substring(0, 5)}_${req.user._id.toString().substring(0, 10)}_${Date.now()}`,
      };

      const order = await razorpayInstance.orders.create(options);

      return sendSuccess({
        req,
        res,
        statusCode: 201,
        message: 'Razorpay order created successfully',
        data: {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId: keyId,
          isMock: false,
        },
      });
    } else {
      // Mock Mode
      const mockOrderId = `order_mock_${Math.random().toString(36).substring(2, 11)}`;
      return sendSuccess({
        req,
        res,
        statusCode: 201,
        message: 'Razorpay order created successfully (Mock Mode)',
        data: {
          orderId: mockOrderId,
          amount: AMOUNT_PAISE,
          currency: 'INR',
          keyId: 'mock_key_id_123',
          isMock: true,
        },
      });
    }
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const verifyRazorpayPayment = async (req: Request, res: Response) => {
  try {
    const { 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature,
    } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id) {
      return sendError({ req, res, statusCode: 400, message: 'Payment ID and Order ID are required' });
    }

    if (isRazorpayConfigured && razorpayInstance && !razorpay_order_id.startsWith('order_mock_')) {
      const generated_signature = crypto
        .createHmac('sha256', keySecret as string)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      if (generated_signature !== razorpay_signature) {
        return sendError({ req, res, statusCode: 400, message: 'Payment verification failed. Invalid signature.' });
      }
    }

    const receiptNumber = 'REC-' + Math.floor(10000000 + Math.random() * 90000000);

    return sendSuccess({
      req,
      res,
      message: 'Payment verified successfully.',
      data: { 
        paymentId: razorpay_payment_id, 
        orderId: razorpay_order_id,
        receiptNumber 
      },
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const getAcademicPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const paymentPurpose = req.query.paymentPurpose as string;

    const feeRecord = await FeeRecord.findOne({
      student: studentId as any,
      paymentPurpose: paymentPurpose || 'Examination fee',
    }).sort({ createdAt: -1 });

    return sendSuccess({
      req,
      res,
      message: 'Payment status retrieved successfully',
      data: {
        paymentStatus: feeRecord ? 'Completed' : 'Pending',
        paymentId: feeRecord?.razorpayPaymentId || feeRecord?.utrNumber,
        paymentDate: feeRecord?.paymentDate,
      },
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const verifyAcademicPayment = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const studentId = req.query.studentId as string;
    const purpose = req.query.purpose as string;

    const existingFee = await FeeRecord.findOne({
      student: studentId as any,
      paymentPurpose: purpose || 'Examination fee',
    });

    if (existingFee) {
      return sendSuccess({
        req,
        res,
        message: 'Payment already recorded',
        data: {
          paymentStatus: 'Completed',
          paymentId: existingFee.utrNumber,
        },
      });
    }

    if (isRazorpayConfigured && razorpayInstance) {
      try {
        const payments = await razorpayInstance.api.get({
          url: '/payments',
          data: { order_id: orderId },
        });
        const payment = payments?.items?.[0];
        if (payment && payment.status === 'captured') {
          const feeRecord = await FeeRecord.create({
            student: studentId as any,
            amount: payment.amount / 100,
            paymentMode: 'Razorpay Online',
            utrNumber: payment.id,
            paymentReceiptUrl: 'Online Verification',
            paymentDate: new Date(),
            paymentPurpose: purpose || 'Examination fee',
            razorpayOrderId: payment.order_id,
            razorpayPaymentId: payment.id,
          });

          return sendSuccess({
            req,
            res,
            message: 'Payment verified successfully',
            data: {
              paymentStatus: 'Completed',
              paymentId: payment.id,
              feeRecord,
            },
          });
        }
      } catch (error) {
        console.error('Error verifying academic payment:', error);
      }
    }

    return sendSuccess({
      req,
      res,
      message: 'Payment pending verification',
      data: {
        paymentStatus: 'Pending',
      },
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ==========================================
// EXAM FEE CONFIGURATION (Academy / Board)
// ==========================================

export const getExamFeeConfigurationByCourse = async (req: Request, res: Response) => {
  try {
    const courseId = String(req.params.courseId);
    const examinationNumber = parseInt(String(req.params.examinationNumber));

    const course = await Course.findById(courseId);
    if (!course) return sendError({ req, res, statusCode: 404, message: 'Course not found' });

    const perExam = getExamFeeConfigEntry(course, examinationNumber);

    return sendSuccess({
      req,
      res,
      message: 'Exam fee configuration retrieved successfully',
      data: {
        courseId,
        examinationNumber,
        firstAttemptFee: perExam?.firstAttemptFee ?? course.examinationFee ?? 0,
        reappearingFee:
          perExam?.reappearingFee ??
          course.reappearingExaminationFee ??
          course.examinationFee ??
          0,
        feeApplicableForFirstAttempt:
          perExam?.feeApplicableForFirstAttempt ??
          course.feeApplicableForFirstAttempt ??
          false,
      },
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const updateExamFeeConfiguration = async (req: Request, res: Response) => {
  try {
    const validatedData = reimbursableFeeSchema.parse(req.body);

    const course = await Course.findById(validatedData.courseId);
    if (!course) return sendError({ req, res, statusCode: 404, message: 'Course not found' });

    if (!course.examFeeConfig) course.examFeeConfig = {} as any;

    setExamFeeConfigEntry(course, validatedData.examinationNumber, {
      // Respect an explicit 0 (fee removed) so the Academy can waive the
      // reappearing fee as well.
      firstAttemptFee: validatedData.firstAttemptFee != null ? validatedData.firstAttemptFee : 0,
      reappearingFee:
        validatedData.reappearingFee != null
          ? validatedData.reappearingFee
          : Number(course.reappearingExaminationFee) ||
            Number(course.examinationFee) ||
            0,
      feeApplicableForFirstAttempt: validatedData.feeApplicableForFirstAttempt,
      updatedBy: req.user._id,
      updatedAt: new Date(),
    });

    await course.save();

    return sendSuccess({
      req,
      res,
      message: 'Exam fee configuration updated successfully',
      data: course.examFeeConfig,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) throw error;
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ==========================================
// REAPPEARING (ARREAR) STUDENTS
// ==========================================

export const getReappearingStudents = async (req: Request, res: Response) => {
  try {
    const { courseId, batchId, examination } = req.query;

    if (!courseId || !batchId || !examination) {
      return sendError({ req, res, statusCode: 400, message: 'Course, batch, and examination are required' });
    }

    const query: any = { course: courseId, batch: batchId };

    if (req.user.role === 'institute') {
      const institute = await Institute.findOne({ user: req.user._id, status: 'Approved' });
      if (!institute) {
        return sendError({ req, res, statusCode: 403, message: 'Access Denied: Your institute is not approved.' });
      }
      query.institute = institute._id;
    }

    const students = await Student.find(query)
      .select('firstName lastName enrollmentId course batch')
      .populate('course', 'name');

    const studentIds = students.map(s => s._id);
    const examinationNumber = parseInt(String(examination), 10);

    const results = await Result.find({
      student: { $in: studentIds },
      examination: examinationNumber,
      isPublished: true,
      resultStatus: { $in: ['FAIL', 'SUPPLEMENTARY'] },
    }).sort({ createdAt: -1 });

    const resultMap = new Map<string, any>();
    results.forEach(r => resultMap.set(r.student.toString(), r));

    const feeRecords = await FeeRecord.find({
      student: { $in: studentIds },
      examinationNumber,
      paymentPurpose: 'Examination fee',
    });

    const paidStudentIds = new Set<string>(feeRecords.map(f => String((f as any).student || '')));

    const reappearingStudents = students
      .map(s => {
        const result = resultMap.get(s._id.toString());
        const failedSubjects = (result?.subjects || [])
          .filter((sub: any) => ['F', 'RA', 'ABSENT'].includes(sub.grade))
          .map((sub: any) => ({
            subjectCode: sub.subjectCode,
            subjectName: sub.subjectName,
            originalMarks: sub.totalMarks || 0,
            originalGrade: sub.grade,
          }));

        return {
          studentId: s._id,
          name: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
          enrollmentId: s.enrollmentId,
          courseId: s.course?._id || courseId,
          batchId: batchId,
          examination: examinationNumber,
          failedSubjects,
          resultId: result?._id,
          hasPayment: paidStudentIds.has(s._id.toString()),
        };
      })
      .filter(s => s.failedSubjects.length > 0);

    return sendSuccess({
      req,
      res,
      message: 'Reappearing students retrieved successfully',
      data: reappearingStudents,
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const verifyStudentEnrollment = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { status, remarks } = req.body;

    if (!['Approved', 'Rejected', 'Correction Required'].includes(status)) {
      return sendError({ 
        req, 
        res, 
        statusCode: 400, 
        message: 'Invalid status. Allowed values: Approved, Rejected, Correction Required.' 
      });
    }

    if ((status === 'Rejected' || status === 'Correction Required') && (!remarks || !remarks.trim())) {
      return sendError({ 
        req, 
        res, 
        statusCode: 400, 
        message: `Remarks/reason are mandatory when marking student enrollment as ${status}.` 
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return sendError({ req, res, statusCode: 404, message: 'Student not found.' });
    }

    student.verificationStatus = status;
    student.verificationRemarks = remarks?.trim() || '';
    student.verifiedBy = req.user._id;
    student.verifiedAt = new Date();

    if (status === 'Correction Required') {
      student.correctionRequestedAt = new Date();
    }

    await student.save();

    const updatedStudent = await Student.findById(studentId)
      .populate('course', 'name courseDuration durationType')
      .populate('batch', 'year')
      .populate('institute', 'orgName instituteAddress phoneNumber emailAddress headName hodName')
      .populate('verifiedBy', 'name email role');

    return sendSuccess({
      req,
      res,
      message: `Student enrollment has been successfully set to '${status}'.`,
      data: updatedStudent,
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ==========================================
// COURSE COMPLETION CERTIFICATES (NBLS, NCLS, NTLS, NULS)
// ==========================================

export const uploadCourseCertificates = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const query: any = { _id: studentId };

    if (req.user.role === 'institute') {
      const institute = await Institute.findOne({ user: req.user._id, status: 'Approved' });
      if (!institute) {
        return sendError({ req, res, statusCode: 403, message: 'Access Denied: Your institute is not approved.' });
      }
      query.institute = institute._id;
    }

    const student = await Student.findOne(query);
    if (!student) {
      return sendError({ req, res, statusCode: 404, message: 'Student not found or unauthorized.' });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const certFields = ['nblsCertificate', 'nclsCertificate', 'ntlsCertificate', 'nulsCertificate'];

    const newDocs: any = { ...student.documents };
    let uploadedCount = 0;

    for (const field of certFields) {
      if (files && files[field] && files[field].length > 0) {
        newDocs[`${field}Url`] = getFileUrl(files[field][0].path);
        uploadedCount++;
      }
    }

    student.documents = newDocs;
    await student.save();

    return sendSuccess({
      req,
      res,
      message: `Course completion certificates updated successfully (${uploadedCount} uploaded).`,
      data: {
        documents: student.documents,
        hasMandatoryCertificate: !!(
          student.documents?.nblsCertificateUrl ||
          student.documents?.nclsCertificateUrl ||
          student.documents?.ntlsCertificateUrl ||
          student.documents?.nulsCertificateUrl
        ),
      },
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};
