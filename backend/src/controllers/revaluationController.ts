import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { RevaluationRequest } from '../models/revaluationRequestModel';
import { RevaluationResult } from '../models/revaluationResultModel';
import { Result } from '../models/resultModel';
import { Student } from '../models/studentModel';
import { Institute } from '../models/instituteModel';
import { FeeRecord } from '../models/feeRecordModel';
import revaluationService from '../services/revaluationService';
import { sendSuccess, sendError } from '../utils/responseFormatter';
import razorpayInstance, { isRazorpayConfigured, keyId } from '../config/razorpay';
import crypto from 'crypto';
import {
  createRevaluationSchema,
  updateRevaluationStatusSchema,
  addRevaluationResultSchema,
} from '../validators/revaluationValidator';

// ─── Create Razorpay Order for Revaluation Fee ──────────────────────────────
export const createRevaluationRazorpayOrder = async (req: Request, res: Response) => {
  try {
    const { studentId, semester, totalFee, requestId, subjects } = req.body;

    if (!studentId || !semester || !totalFee) {
      return sendError({ req, res, statusCode: 400, message: 'Student ID, semester, and total fee are required' });
    }

    const institute = await Institute.findOne({ user: req.user._id });
    if (!institute) {
      return sendError({ req, res, statusCode: 403, message: 'Institute not found for this account' });
    }

    const student = await Student.findOne({ _id: studentId, institute: institute._id });
    if (!student) {
      return sendError({ req, res, statusCode: 404, message: 'Student not found or does not belong to this institute' });
    }

    // Check if there's already a pending payment for this student
    const existingFee = await FeeRecord.findOne({
      student: studentId,
      paymentPurpose: 'Revaluation fee',
      semesterNumber: semester,
    });

    if (existingFee) {
      return sendError({ req, res, statusCode: 400, message: 'Revaluation fee already paid for this semester' });
    }

    const amountInPaise = Math.round(Number(totalFee) * 100);

    if (isRazorpayConfigured && razorpayInstance) {
      const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `reval_${student.enrollmentId}_${semester}_${Date.now()}`,
        notes: {
          studentId: studentId.toString(),
          semester: semester.toString(),
          requestId: requestId || 'pending',
          purpose: 'Revaluation fee',
          subjectCodes: subjects ? subjects.map((s: any) => s.subjectCode).join(',') : '',
        },
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
      // Mock Mode fallback
      const mockOrderId = `order_mock_${Math.random().toString(36).substring(2, 11)}`;
      return sendSuccess({
        req,
        res,
        statusCode: 201,
        message: 'Razorpay order created successfully (Mock Mode)',
        data: {
          orderId: mockOrderId,
          amount: amountInPaise,
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

// ─── Verify Razorpay Payment for Revaluation ────────────────────────────────
export const verifyRevaluationRazorpayPayment = async (req: Request, res: Response) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      studentId,
      semester,
      subjects,
      academicYear,
      instituteId,
      resultId,
      feePerSubject,
      totalFee,
    } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id) {
      return sendError({ req, res, statusCode: 400, message: 'Payment ID and Order ID are required' });
    }

    if (!studentId || !subjects || subjects.length === 0) {
      return sendError({ req, res, statusCode: 400, message: 'Student ID and subjects are required' });
    }

    // Verify signature (skip for mock mode)
    if (isRazorpayConfigured && razorpayInstance && !razorpay_order_id.startsWith('order_mock_')) {
      const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      if (generated_signature !== razorpay_signature) {
        return sendError({ req, res, statusCode: 400, message: 'Payment verification failed. Invalid signature.' });
      }
    }

    // Check if payment already processed
    const existingRequest = await RevaluationRequest.findOne({
      student: studentId,
      result: resultId,
      status: { $in: ['PENDING', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS'] },
    });

    if (existingRequest) {
      return sendError({ req, res, statusCode: 400, message: 'A revaluation request already exists for this result' });
    }

    // Create fee record
    const feeRecord = await FeeRecord.create({
      student: studentId,
      semesterNumber: semester,
      amount: totalFee,
      paymentMode: 'Razorpay Online',
      utrNumber: razorpay_payment_id,
      paymentReceiptUrl: 'Online Verification',
      paymentDate: new Date(),
      paymentPurpose: 'Revaluation fee',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    // Create revaluation request with payment details
    const requestData: any = {
      student: studentId,
      result: resultId,
      institute: instituteId,
      academicYear: academicYear,
      semester: semester,
      subjects: subjects,
      feePerSubject: feePerSubject || 500,
      totalFee: totalFee,
      paymentStatus: 'PAID',
      paymentId: razorpay_payment_id,
      paymentOrderId: razorpay_order_id,
      paymentSignature: razorpay_signature,
      paymentDate: new Date(),
      status: 'PENDING',
      requestId: revaluationService.generateRequestId(),
      submittedDate: new Date(),
      auditTrail: [
        {
          action: 'REQUEST_SUBMITTED',
          previousStatus: null,
          newStatus: 'PENDING',
          performedBy: req.user._id,
          timestamp: new Date(),
        },
      ],
    };

    const revaluationRequest = await RevaluationRequest.create(requestData);

    // Link to result
    await Result.findByIdAndUpdate(resultId, {
      $push: { revaluationRequests: revaluationRequest._id },
    });

    return sendSuccess({
      req,
      res,
      message: 'Payment verified and revaluation request submitted successfully',
      data: {
        paymentStatus: 'Completed',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        receiptNumber: `REC-${Math.floor(10000000 + Math.random() * 90000000)}`,
        revaluationRequest,
        feeRecord,
      },
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ─── Get Revaluation Payment Status ──────────────────────────────────────────
export const getRevaluationPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { semester } = req.query;

    const feeRecord = await FeeRecord.findOne({
      student: studentId,
      paymentPurpose: 'Revaluation fee',
      semesterNumber: semester ? parseInt(semester as string) : undefined,
    }).sort({ createdAt: -1 });

    return sendSuccess({
      req,
      res,
      message: 'Payment status retrieved successfully',
      data: {
        paymentStatus: feeRecord ? 'Completed' : 'Pending',
        paymentId: feeRecord?.razorpayPaymentId || feeRecord?.utrNumber,
        paymentDate: feeRecord?.paymentDate,
        amount: feeRecord?.amount,
      },
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ─── Verify Order Status for Recovery ──────────────────────────────────────
export const verifyRevaluationOrderStatus = async (req: Request, res: Response) => {
  try {
    const orderId = req.params.orderId as string;
    const studentId = req.query.studentId as string;
    const semester = req.query.semester as string;

    // Check if fee already exists
    const existingFee = await FeeRecord.findOne({
      student: studentId,
      razorpayOrderId: orderId,
      paymentPurpose: 'Revaluation fee',
    });

    if (existingFee) {
      // Check if request already exists
      const existingRequest = await RevaluationRequest.findOne({
        student: studentId,
        paymentOrderId: orderId,
      });

      return sendSuccess({
        req,
        res,
        message: 'Payment already recorded',
        data: {
          paymentStatus: 'Completed',
          paymentId: existingFee.razorpayPaymentId || existingFee.utrNumber,
          amount: existingFee.amount,
          requestExists: !!existingRequest,
          revaluationRequest: existingRequest || null,
        },
      });
    }

    if (isRazorpayConfigured && razorpayInstance && !orderId.startsWith('order_mock_')) {
      try {
        const payments = await razorpayInstance.api.get({
          url: '/payments',
          data: { order_id: orderId },
        });
        const payment = payments?.items?.[0];
        if (payment && payment.status === 'captured') {
          // Create fee record if not exists
          const feeRecord = await FeeRecord.create({
            student: studentId,
            semesterNumber: semester ? parseInt(semester as string) : undefined,
            amount: payment.amount / 100,
            paymentMode: 'Razorpay Online',
            utrNumber: payment.id,
            paymentReceiptUrl: 'Online Verification',
            paymentDate: new Date(),
            paymentPurpose: 'Revaluation fee',
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
        console.error('Error verifying revaluation payment:', error);
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

// ─── Original Controllers (modified to remove UTR-based payment) ────────────

export const createRevaluationRequest = async (req: Request, res: Response) => {
  try {
    const validatedData = createRevaluationSchema.parse(req.body);
    const userId = req.user._id;

    const student = await Student.findById(validatedData.student);
    if (!student) {
      return sendError({ req, res, statusCode: 404, message: 'Student not found' });
    }

    // Institute users may only request revaluation for their own students
    if (req.user.role === 'institute') {
      const institute = await Institute.findOne({ user: req.user._id });
      if (!institute) {
        return sendError({ req, res, statusCode: 403, message: 'Institute not found for this account' });
      }
      if (student.institute.toString() !== institute._id.toString()) {
        return sendError({ req, res, statusCode: 403, message: 'Student does not belong to your institute' });
      }
    }

    const result = await Result.findById(validatedData.result);
    if (!result) {
      return sendError({ req, res, statusCode: 404, message: 'Result not found' });
    }

    if (!result.isRevaluationActive || (result.revaluationDeadline && new Date() > result.revaluationDeadline)) {
      return sendError({ req, res, statusCode: 400, message: 'Revaluation period has expired' });
    }

    const absentSubjects = validatedData.subjects.filter((subject: any) => {
      const resultSubject = result.subjects.find((s: any) => s.subjectCode === subject.subjectCode);
      return resultSubject?.grade === 'ABSENT';
    });

    if (absentSubjects.length > 0) {
      return sendError({ req, res, statusCode: 400, message: 'Revaluation cannot be applied for subjects with ABSENT grade' });
    }

    const existingRequest = await RevaluationRequest.findOne({
      student: validatedData.student,
      result: validatedData.result,
      status: { $in: ['PENDING', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS'] },
    });

    if (existingRequest) {
      return sendError({ req, res, statusCode: 400, message: 'A revaluation request already exists for this result' });
    }

    // Check if fee is already paid via Razorpay
    const feeRecord = await FeeRecord.findOne({
      student: validatedData.student,
      paymentPurpose: 'Revaluation fee',
      semesterNumber: validatedData.semester,
    }).sort({ createdAt: -1 });

    if (!feeRecord) {
      return sendError({ req, res, statusCode: 400, message: 'Revaluation fee payment is required. Please complete the payment first.' });
    }

    // Create request with PAID status
    const requestData: any = {
      ...validatedData,
      requestId: revaluationService.generateRequestId(),
      status: 'PENDING',
      paymentStatus: 'PAID',
      paymentId: feeRecord.razorpayPaymentId || feeRecord.utrNumber,
      paymentDate: feeRecord.paymentDate,
      submittedDate: new Date(),
      auditTrail: [
        {
          action: 'REQUEST_SUBMITTED',
          previousStatus: null,
          newStatus: 'PENDING',
          performedBy: userId,
          timestamp: new Date(),
        },
      ],
    };

    const revaluationRequest = await RevaluationRequest.create(requestData);

    await Result.findByIdAndUpdate(validatedData.result, {
      $push: { revaluationRequests: revaluationRequest._id },
    });

    return sendSuccess({
      req,
      res,
      statusCode: 201,
      message: 'Revaluation request submitted successfully',
      data: revaluationRequest,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) throw error;
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ─── Get Eligible Students for Revaluation (Institute) ──────────────────────
export const getEligibleStudents = async (req: Request, res: Response) => {
  try {
    const { courseId, batchId, semester } = req.query;

    if (!courseId || !batchId || !semester) {
      return sendError({ req, res, statusCode: 400, message: 'Course, batch, and semester are required' });
    }

    const institute = await Institute.findOne({ user: req.user._id });
    if (!institute) {
      return sendError({ req, res, statusCode: 403, message: 'Institute not found' });
    }

    const studentFilter: any = {
      institute: institute._id,
      course: courseId,
      batch: batchId,
    };
    const students = await Student.find(studentFilter).populate('course', 'name');

    const semNum = parseInt(semester as string);
    const eligibleStudents: any[] = [];

    for (const student of students) {
      const result = await Result.findOne({
        student: student._id,
        semester: semNum,
        isPublished: true,
      });

      if (!result) continue;

      if (!result.isRevaluationActive || (result.revaluationDeadline && new Date() > result.revaluationDeadline)) {
        continue;
      }

      // Check if already paid
      const existingPayment = await FeeRecord.findOne({
        student: student._id,
        paymentPurpose: 'Revaluation fee',
        semesterNumber: semNum,
      });

      // Check if request already exists
      const existingRequest = await RevaluationRequest.findOne({
        student: student._id,
        result: result._id,
        status: { $in: ['PENDING', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS'] },
      });

      if (existingRequest) continue;

      const allSubjects = result.subjects.map((subject: any) => {
        const isAbsent = subject.grade === 'ABSENT';
        const marks = subject.totalMarks || 0;
        return {
          subjectCode: subject.subjectCode,
          subjectName: subject.subjectName,
          originalMarks: marks,
          originalGrade: subject.grade || 'F',
          internalMarks: subject.internalMarks || 0,
          externalMarks: subject.externalMarks || 0,
          isAbsent,
          isEligible: !isAbsent,
          revaluationReason: '',
        };
      });

      const eligibleSubjects = allSubjects.filter((subject: any) => subject.isEligible);

      if (eligibleSubjects.length === 0) continue;

      const feePerSubject = 500;
      const totalFee = eligibleSubjects.length * feePerSubject;

      eligibleStudents.push({
        studentId: student._id,
        enrollmentId: student.enrollmentId,
        name: `${student.firstName} ${student.lastName}`,
        course: student.course,
        instituteId: institute._id,
        resultId: result._id,
        semester: semNum,
        academicYear: result.academicYear,
        subjects: eligibleSubjects,
        allSubjects,
        feePerSubject,
        totalFee,
        hasPendingPayment: !!existingPayment,
        submittedDate: new Date(),
      });
    }

    return sendSuccess({
      req,
      res,
      message: 'Eligible students retrieved successfully',
      data: eligibleStudents,
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ─── Get Single Student Eligibility ──────────────────────────────────────────
export const getSingleStudentEligibility = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { semester } = req.query;

    if (!semester) {
      return sendError({ req, res, statusCode: 400, message: 'Semester is required' });
    }

    const institute = await Institute.findOne({ user: req.user._id });
    if (!institute) {
      return sendError({ req, res, statusCode: 403, message: 'Institute not found' });
    }

    const student = await Student.findOne({ _id: studentId, institute: institute._id });
    if (!student) {
      return sendError({ req, res, statusCode: 404, message: 'Student not found' });
    }

    const semNum = parseInt(semester as string);
    const result = await Result.findOne({
      student: student._id,
      semester: semNum,
      isPublished: true,
    });

    if (!result) {
      return sendError({ req, res, statusCode: 404, message: 'Published result not found for this semester' });
    }

    if (!result.isRevaluationActive || (result.revaluationDeadline && new Date() > result.revaluationDeadline)) {
      return sendError({ req, res, statusCode: 400, message: 'Revaluation period has expired for this result' });
    }

    // Check if already paid
    const existingPayment = await FeeRecord.findOne({
      student: student._id,
      paymentPurpose: 'Revaluation fee',
      semesterNumber: semNum,
    });

    // Check if request already exists
    const existingRequest = await RevaluationRequest.findOne({
      student: student._id,
      result: result._id,
      status: { $in: ['PENDING', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS'] },
    });

    if (existingRequest) {
      return sendError({ req, res, statusCode: 400, message: 'A revaluation request already exists for this student' });
    }

    const allSubjects = result.subjects.map((subject: any) => {
      const isAbsent = subject.grade === 'ABSENT';
      const marks = subject.totalMarks || 0;
      return {
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        originalMarks: marks,
        originalGrade: subject.grade || 'F',
        internalMarks: subject.internalMarks || 0,
        externalMarks: subject.externalMarks || 0,
        isAbsent,
        isEligible: !isAbsent,
        revaluationReason: '',
      };
    });

    const eligibleSubjects = allSubjects.filter((subject: any) => subject.isEligible);

    if (eligibleSubjects.length === 0) {
      return sendError({ req, res, statusCode: 400, message: 'No eligible subjects found for revaluation' });
    }

    const feePerSubject = 500;
    const totalFee = eligibleSubjects.length * feePerSubject;

    return sendSuccess({
      req,
      res,
      message: 'Student eligibility retrieved successfully',
      data: {
        studentId: student._id,
        enrollmentId: student.enrollmentId,
        name: `${student.firstName} ${student.lastName}`,
        course: student.course,
        instituteId: institute._id,
        resultId: result._id,
        semester: semNum,
        academicYear: result.academicYear,
        subjects: eligibleSubjects,
        allSubjects,
        feePerSubject,
        totalFee,
        hasPendingPayment: !!existingPayment,
        submittedDate: new Date(),
      },
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ─── Other existing controllers (unchanged) ──────────────────────────────────

export const getAllRevaluationRequests = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      status,
      institute,
      academicYear,
      semester,
      courseId,
      batchId,
      studentId,
      search,
      fromDate,
      toDate,
    } = req.query;

    const query: any = {};

    // Role-based filtering: institute users only see their own requests
    if (req.user.role === 'institute') {
      const instituteDoc = await Institute.findOne({ user: req.user._id });
      if (!instituteDoc) {
        return sendError({ req, res, statusCode: 403, message: 'Institute not found for this account' });
      }
      query.institute = instituteDoc._id;
    } else if (institute) {
      query.institute = institute;
    }

    if (status) query.status = status;
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = parseInt(semester as string);
    if (studentId) query.student = studentId;

    // Course, batch and search filtering via student lookup
    if (courseId || batchId || search) {
      const idSets: any[] = [];

      if (courseId || batchId) {
        const studentQuery: any = {};
        if (courseId) studentQuery.course = courseId;
        if (batchId) studentQuery.batch = batchId;
        const students = await Student.find(studentQuery).select('_id');
        idSets.push(students.map((s) => s._id));
      }

      if (search) {
        const students = await Student.find({
          $or: [
            { firstName: { $regex: search as string, $options: 'i' } },
            { lastName: { $regex: search as string, $options: 'i' } },
            { enrollmentId: { $regex: search as string, $options: 'i' } },
          ],
        }).select('_id');
        idSets.push(students.map((s) => s._id));
      }

      let studentIds = idSets[0];
      for (const set of idSets.slice(1)) {
        studentIds = studentIds.filter((id: any) => set.some((other: any) => other.toString() === id.toString()));
      }
      query.student = { $in: studentIds };
    }

    if (fromDate || toDate) {
      query.submittedDate = {};
      if (fromDate) query.submittedDate.$gte = new Date(fromDate as string);
      if (toDate) query.submittedDate.$lte = new Date(toDate as string);
    }

    const options = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      populate: [
        { path: 'student', select: 'firstName lastName enrollmentId email course batch' },
        { path: 'institute', select: 'orgName' },
        { path: 'result', select: 'academicYear semester totalMarks percentage resultStatus' },
        { path: 'assignedEvaluator', select: 'name email' },
        { path: 'revaluationResults', select: 'subjectCode reviewStatus isFinal' },
      ],
      sort: { submittedDate: -1 } as any,
    };

    const requests = await revaluationService.getRequestsWithPagination(query, options);

    return sendSuccess({ req, res, message: 'Revaluation requests retrieved successfully', data: requests });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const getRevaluationRequestById = async (req: Request, res: Response) => {
  try {
    const request = await RevaluationRequest.findById(req.params.id)
      .populate('student', 'firstName lastName enrollmentId email course batch')
      .populate('institute', 'orgName')
      .populate('result', 'academicYear semester totalMarks percentage subjects resultStatus')
      .populate('assignedEvaluator', 'name email')
      .populate('revaluationResults');

    if (!request) {
      return sendError({ req, res, statusCode: 404, message: 'Revaluation request not found' });
    }

    // Role-based access control
    if (req.user.role === 'institute') {
      const institute = await Institute.findOne({ user: req.user._id });
      if (!institute || institute._id.toString() !== request.institute.toString()) {
        return sendError({ req, res, statusCode: 403, message: 'Unauthorized to view this request' });
      }
    }

    return sendSuccess({ req, res, message: 'Revaluation request retrieved successfully', data: request });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const updateRequestStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateRevaluationStatusSchema.parse(req.body);
    const userId = req.user._id;

    const request = await RevaluationRequest.findById(id);
    if (!request) {
      return sendError({ req, res, statusCode: 404, message: 'Revaluation request not found' });
    }

    const previousStatus = request.status;
    request.status = validatedData.status;

    if (validatedData.comments) {
      request.adminComments.push({
        comment: validatedData.comments,
        commentedBy: userId,
        timestamp: new Date(),
      });
    }

    if (validatedData.assignedEvaluator) {
      if (mongoose.Types.ObjectId.isValid(validatedData.assignedEvaluator)) {
        request.assignedEvaluator = validatedData.assignedEvaluator as any;
      } else {
        request.adminComments.push({
          comment: `Assigned evaluator: ${validatedData.assignedEvaluator}`,
          commentedBy: userId,
          timestamp: new Date(),
        });
      }
    }

    if (validatedData.status === 'ASSIGNED' && validatedData.assignedEvaluator) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 15);
      request.reviewDeadline = deadline;
    }

    if (validatedData.status === 'COMPLETED' || validatedData.status === 'REJECTED') {
      request.evaluatedDate = new Date();
    }

    request.auditTrail.push({
      action: 'STATUS_UPDATED',
      previousStatus,
      newStatus: validatedData.status,
      performedBy: userId,
      timestamp: new Date(),
    });

    await request.save();

    if (validatedData.status === 'COMPLETED') {
      await revaluationService.processRevaluationResults(request._id.toString());
    }

    return sendSuccess({ req, res, message: 'Revaluation request status updated successfully', data: request });
  } catch (error: any) {
    if (error instanceof z.ZodError) throw error;
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ─── Auto-Update Status from Subject Evaluation Progress ────────────────────
// After marks are recorded, sync the request status to the evaluation progress:
// all subjects evaluated -> COMPLETED, some -> IN_PROGRESS. Terminal statuses
// (COMPLETED/REJECTED/CANCELLED) and manual statuses are left untouched.
const autoUpdateStatusFromProgress = async (request: any, performedBy: any) => {
  const totalSubjects = request.subjects?.length || 0;
  if (totalSubjects === 0) return;

  const results = await RevaluationResult.find({ revaluationRequest: request._id });
  const evaluatedSubjects = new Set(results.map((r: any) => r.subjectCode)).size;
  if (evaluatedSubjects === 0) return;

  if (['COMPLETED', 'REJECTED', 'CANCELLED'].includes(request.status)) return;

  const newStatus = evaluatedSubjects >= totalSubjects ? 'COMPLETED' : 'IN_PROGRESS';
  if (newStatus === request.status) return;

  const previousStatus = request.status;
  request.status = newStatus;
  request.auditTrail.push({
    action: 'AUTO_STATUS_UPDATE',
    previousStatus,
    newStatus,
    performedBy: performedBy || undefined,
  });
  await request.save();
};

export const addRevaluationResult = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = addRevaluationResultSchema.parse(req.body);
    const userId = req.user._id;

    const request = await RevaluationRequest.findById(id);
    if (!request) {
      return sendError({ req, res, statusCode: 404, message: 'Revaluation request not found' });
    }

    const subjectExists = request.subjects.some((s: any) => s.subjectCode === validatedData.subjectCode);
    if (!subjectExists) {
      return sendError({ req, res, statusCode: 400, message: 'Subject not found in revaluation request' });
    }

    const originalSubject = request.subjects.find((s: any) => s.subjectCode === validatedData.subjectCode);
    const marksChange = validatedData.revisedTotalMarks - (originalSubject?.originalMarks || 0);

    const revaluationResult = await RevaluationResult.create({
      ...validatedData,
      marksChange,
      revaluationRequest: request._id,
      student: request.student,
      result: request.result,
      reviewedBy: userId,
      reviewedDate: new Date(),
      originalMarks: originalSubject?.originalMarks,
      originalGrade: originalSubject?.originalGrade,
    });

    request.revaluationResults.push(revaluationResult._id);
    await request.save();

    await autoUpdateStatusFromProgress(request, userId);

    return sendSuccess({ req, res, statusCode: 201, message: 'Revaluation result added successfully', data: revaluationResult });
  } catch (error: any) {
    if (error instanceof z.ZodError) throw error;
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const getRevaluationResults = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const results = await RevaluationResult.find({ revaluationRequest: id }).populate('reviewedBy', 'name email');

    if (!results || results.length === 0) {
      return sendError({ req, res, statusCode: 404, message: 'No revaluation results found' });
    }

    return sendSuccess({ req, res, message: 'Revaluation results retrieved successfully', data: results });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const approveRevaluationResult = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isFinal, comments } = req.body;

    const revalResult = await RevaluationResult.findById(id);
    if (!revalResult) {
      return sendError({ req, res, statusCode: 404, message: 'Revaluation result not found' });
    }

    revalResult.reviewStatus = 'APPROVED';
    revalResult.isFinal = isFinal || true;

    if (comments) {
      revalResult.evaluatorComments = comments;
    }

    await revalResult.save();

    if (isFinal) {
      await revaluationService.updateResultWithRevaluation(revalResult);
    }

    const request = await RevaluationRequest.findById(revalResult.revaluationRequest);
    if (request) {
      await autoUpdateStatusFromProgress(request, req.user._id);
    }

    return sendSuccess({ req, res, message: 'Revaluation result approved successfully', data: revalResult });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ─── Institute Revaluation Summary ───────────────────────────────────────────
export const getInstituteSummary = async (req: Request, res: Response) => {
  try {
    const institute = await Institute.findOne({ user: req.user._id });
    if (!institute) {
      return sendError({ req, res, statusCode: 403, message: 'Institute not found' });
    }

    const requests = await RevaluationRequest.find({ institute: institute._id });

    const summary = {
      total: requests.length,
      pending: requests.filter((r) => r.status === 'PENDING').length,
      underReview: requests.filter((r) => r.status === 'UNDER_REVIEW').length,
      assigned: requests.filter((r) => r.status === 'ASSIGNED').length,
      inProgress: requests.filter((r) => r.status === 'IN_PROGRESS').length,
      completed: requests.filter((r) => r.status === 'COMPLETED').length,
      rejected: requests.filter((r) => r.status === 'REJECTED').length,
      cancelled: requests.filter((r) => r.status === 'CANCELLED').length,
      changed: requests.filter((r) => r.finalResult === 'CHANGED').length,
      unchanged: requests.filter((r) => r.finalResult === 'UNCHANGED').length,
      totalFee: requests.reduce((sum, r) => sum + (r.totalFee || 0), 0),
    };

    return sendSuccess({
      req,
      res,
      message: 'Institute revaluation summary retrieved',
      data: summary,
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ─── Academy Revaluation Summary ─────────────────────────────────────────────
export const getAcademySummary = async (req: Request, res: Response) => {
  try {
    const { academicYear, semester } = req.query;

    const query: any = {};
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = parseInt(semester as string);

    const requests = await RevaluationRequest.find(query);

    const summary = {
      total: requests.length,
      pending: requests.filter((r) => r.status === 'PENDING').length,
      underReview: requests.filter((r) => r.status === 'UNDER_REVIEW').length,
      assigned: requests.filter((r) => r.status === 'ASSIGNED').length,
      inProgress: requests.filter((r) => r.status === 'IN_PROGRESS').length,
      completed: requests.filter((r) => r.status === 'COMPLETED').length,
      rejected: requests.filter((r) => r.status === 'REJECTED').length,
      cancelled: requests.filter((r) => r.status === 'CANCELLED').length,
      changed: requests.filter((r) => r.finalResult === 'CHANGED').length,
      unchanged: requests.filter((r) => r.finalResult === 'UNCHANGED').length,
      totalFee: requests.reduce((sum, r) => sum + (r.totalFee || 0), 0),
      subjectsCount: requests.reduce((sum, r) => sum + (r.subjects?.length || 0), 0),
    };

    const instituteStats = await RevaluationRequest.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$institute',
          count: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: 'institutes',
          localField: '_id',
          foreignField: '_id',
          as: 'institute',
        },
      },
      { $unwind: { path: '$institute', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          instituteName: '$institute.orgName',
          count: 1,
          pending: 1,
          completed: 1,
        },
      },
    ]);

    return sendSuccess({
      req,
      res,
      message: 'Academy revaluation summary retrieved',
      data: { ...summary, instituteStats },
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const getRevaluationStatistics = async (req: Request, res: Response) => {
  try {
    const { academicYear, semester } = req.query;

    const statistics = await revaluationService.getRevaluationStatistics({ academicYear, semester });

    return sendSuccess({ req, res, message: 'Revaluation statistics retrieved successfully', data: statistics });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const deleteRevaluationRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const request = await RevaluationRequest.findById(id);
    if (!request) {
      return sendError({ req, res, statusCode: 404, message: 'Revaluation request not found' });
    }

    if (request.status === 'COMPLETED') {
      return sendError({ req, res, statusCode: 400, message: 'Cannot delete completed revaluation request' });
    }

    request.status = 'CANCELLED';
    request.auditTrail.push({
      action: 'REQUEST_CANCELLED',
      previousStatus: request.status,
      newStatus: 'CANCELLED',
      performedBy: userId,
      timestamp: new Date(),
    });

    await request.save();

    return sendSuccess({ req, res, message: 'Revaluation request cancelled successfully', data: null });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};
