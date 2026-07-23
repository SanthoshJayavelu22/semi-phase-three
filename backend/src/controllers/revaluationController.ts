import { Request, Response } from 'express';
import { z } from 'zod';
import { RevaluationRequest } from '../models/revaluationRequestModel';
import { RevaluationResult } from '../models/revaluationResultModel';
import { Result } from '../models/resultModel';
import { Student } from '../models/studentModel';
import revaluationService from '../services/revaluationService';
import { sendSuccess, sendError } from '../utils/responseFormatter';
import {
  createRevaluationSchema,
  updateRevaluationStatusSchema,
  addRevaluationResultSchema,
} from '../validators/revaluationValidator';

export const createRevaluationRequest = async (req: Request, res: Response) => {
  try {
    const validatedData = createRevaluationSchema.parse(req.body);
    const userId = req.user._id;

    const student = await Student.findById(validatedData.student);
    if (!student) {
      return sendError({ req, res, statusCode: 404, message: 'Student not found' });
    }

    const result = await Result.findById(validatedData.result);
    if (!result) {
      return sendError({ req, res, statusCode: 404, message: 'Result not found' });
    }

    if (!result.isRevaluationActive || (result.revaluationDeadline && new Date() > result.revaluationDeadline)) {
      return sendError({ req, res, statusCode: 400, message: 'Revaluation period has expired' });
    }

    const existingRequest = await RevaluationRequest.findOne({
      student: validatedData.student,
      result: validatedData.result,
      status: { $in: ['PENDING', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS'] },
    });

    if (existingRequest) {
      return sendError({ req, res, statusCode: 400, message: 'Revaluation request already exists for this result' });
    }

    const requestData: any = {
      ...validatedData,
      requestId: revaluationService.generateRequestId(),
      status: 'PENDING',
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

export const getAllRevaluationRequests = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', status, institute, academicYear, semester, fromDate, toDate } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (institute) query.institute = institute;
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = parseInt(semester as string);

    if (fromDate || toDate) {
      query.submittedDate = {};
      if (fromDate) query.submittedDate.$gte = new Date(fromDate as string);
      if (toDate) query.submittedDate.$lte = new Date(toDate as string);
    }

    const options = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      populate: [
        { path: 'student', select: 'firstName lastName enrollmentId email' },
        { path: 'institute', select: 'orgName' },
        { path: 'result', select: 'academicYear semester totalMarks percentage' },
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
      .populate('student', 'firstName lastName enrollmentId email')
      .populate('institute', 'orgName')
      .populate('result', 'academicYear semester totalMarks percentage')
      .populate('assignedEvaluator', 'name email')
      .populate('revaluationResults');

    if (!request) {
      return sendError({ req, res, statusCode: 404, message: 'Revaluation request not found' });
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
      request.assignedEvaluator = validatedData.assignedEvaluator as any;
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

    return sendSuccess({ req, res, message: 'Revaluation result approved successfully', data: revalResult });
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
