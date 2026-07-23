import { Request, Response } from 'express';
import { z } from 'zod';
import { Result } from '../models/resultModel';
import { Student } from '../models/studentModel';
import { Marksheet } from '../models/marksheetModel';
import resultService from '../services/resultService';
import pdfGeneratorService from '../services/pdfGeneratorService';
import fileParserService from '../services/fileParserService';
import { ParsedResultData } from '../services/fileParserService';
import { sendSuccess, sendError } from '../utils/responseFormatter';
import { createResultSchema, updateResultSchema, bulkUploadSchema } from '../validators/resultValidator';

export const getAllResults = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', academicYear, semester, resultStatus, isPublished, studentId, search } = req.query;

    const query: any = {};

    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = parseInt(semester as string);
    if (resultStatus) query.resultStatus = resultStatus;
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';
    if (studentId) query.student = studentId;

    if (search) {
      const students = await Student.find({
        $or: [
          { firstName: { $regex: search as string, $options: 'i' } },
          { lastName: { $regex: search as string, $options: 'i' } },
          { enrollmentId: { $regex: search as string, $options: 'i' } },
        ],
      }).select('_id');

      query.student = { $in: students.map((s) => s._id) };
    }

    const options = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      populate: [{ path: 'student', select: 'firstName lastName enrollmentId email' }],
      sort: { createdAt: -1 } as any,
    };

    const results = await resultService.getResultsWithPagination(query, options);

    return sendSuccess({ req, res, message: 'Results retrieved successfully', data: results });
  } catch (error: any) {
    if (error instanceof z.ZodError) throw error;
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const getResultById = async (req: Request, res: Response) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('student', 'firstName lastName enrollmentId email')
      .populate('revaluationRequests', 'requestId status subjects');

    if (!result) {
      return sendError({ req, res, statusCode: 404, message: 'Result not found' });
    }

    return sendSuccess({ req, res, message: 'Result retrieved successfully', data: result });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const getResultByStudent = async (req: Request, res: Response) => {
  try {
    const { enrollmentId } = req.params;
    const { dateOfBirth } = req.query;

    const student = await Student.findOne({ enrollmentId })
      .populate('institute', 'orgName')
      .populate('batch', 'name year');
    if (!student) {
      return sendError({ req, res, statusCode: 404, message: 'Student not found' });
    }

    if (dateOfBirth && student.dateOfBirth) {
      const queryDob = new Date(dateOfBirth as string).toISOString().split('T')[0];
      const studentDob = student.dateOfBirth.toISOString().split('T')[0];
      if (queryDob !== studentDob) {
        return sendError({ req, res, statusCode: 401, message: 'Invalid Date of Birth' });
      }
    }

    const results = await Result.find({ student: student._id })
      .populate('student', 'firstName lastName enrollmentId email')
      .sort({ academicYear: -1, semester: -1 });

    if (!results || results.length === 0) {
      return sendError({ req, res, statusCode: 404, message: 'No results found for this student' });
    }

    return sendSuccess({
      req,
      res,
      message: 'Student results retrieved successfully',
      data: { student, results },
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const createResult = async (req: Request, res: Response) => {
  try {
    const validatedData = createResultSchema.parse(req.body);
    const userId = req.user._id;

    const student = await Student.findById(validatedData.student);
    if (!student) {
      return sendError({ req, res, statusCode: 404, message: 'Student not found' });
    }

    const existingResult = await Result.findOne({
      student: validatedData.student,
      academicYear: validatedData.academicYear,
      semester: validatedData.semester,
    });

    if (existingResult) {
      return sendError({
        req,
        res,
        statusCode: 400,
        message: 'Result already exists for this student in the given academic year and semester',
      });
    }

    const calculatedData = resultService.calculateResultMetrics(validatedData.subjects);

    const resultData: any = {
      ...validatedData,
      totalMarks: calculatedData.totalMarks,
      totalCredits: calculatedData.totalCredits,
      percentage: calculatedData.percentage,
      cgpa: calculatedData.cgpa,
      sgpa: calculatedData.sgpa,
      division: calculatedData.division,
      resultStatus: calculatedData.resultStatus,
      auditHistory: [
        {
          action: 'CREATED',
          performedBy: userId,
          timestamp: new Date(),
        },
      ],
    };

    const result = await Result.create(resultData);

    const populatedResult = await Result.findById(result._id).populate('student');
    if (populatedResult) {
      const student = (populatedResult as any).student;
      await pdfGeneratorService.generateMarksheetPDF({
        result: populatedResult,
        student,
        marksheetNumber: `MS-${(student as any).enrollmentId}-${populatedResult.academicYear}-S${populatedResult.semester}`,
      });
    }

    return sendSuccess({ req, res, statusCode: 201, message: 'Result created successfully', data: result });
  } catch (error: any) {
    if (error instanceof z.ZodError) throw error;
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const updateResult = async (req: Request, res: Response) => {
  try {
    const resultId = req.params.id;
    const validatedData = updateResultSchema.parse(req.body);
    const userId = req.user._id;

    const result = await Result.findById(resultId);
    if (!result) {
      return sendError({ req, res, statusCode: 404, message: 'Result not found' });
    }

    const previousData = result.toObject();

    Object.keys(validatedData).forEach((key) => {
      if (key !== 'auditHistory' && key !== 'revaluationRequests') {
        (result as any)[key] = (validatedData as any)[key];
      }
    });

    if (validatedData.subjects) {
      const calculatedData = resultService.calculateResultMetrics(validatedData.subjects);
      result.totalMarks = calculatedData.totalMarks;
      result.totalCredits = calculatedData.totalCredits;
      result.percentage = calculatedData.percentage;
      result.cgpa = calculatedData.cgpa;
      result.sgpa = calculatedData.sgpa;
      result.division = calculatedData.division as any;
      result.resultStatus = calculatedData.resultStatus as any;
    }

    result.auditHistory.push({
      action: 'UPDATED',
      previousData,
      newData: validatedData,
      performedBy: userId,
      timestamp: new Date(),
    });

    await result.save();

    if (validatedData.subjects || validatedData.isPublished !== undefined) {
      const populated = await Result.findById(result._id).populate('student');
      if (populated) {
        const student = (populated as any).student;
        await pdfGeneratorService.generateMarksheetPDF({
          result: populated,
          student,
          marksheetNumber: `MS-${(student as any).enrollmentId}-${populated.academicYear}-S${populated.semester}`,
        });
      }
    }

    return sendSuccess({ req, res, message: 'Result updated successfully', data: result });
  } catch (error: any) {
    if (error instanceof z.ZodError) throw error;
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const deleteResult = async (req: Request, res: Response) => {
  try {
    const resultId = req.params.id;

    const result = await Result.findById(resultId);
    if (!result) {
      return sendError({ req, res, statusCode: 404, message: 'Result not found' });
    }

    if (result.revaluationRequests && result.revaluationRequests.length > 0) {
      return sendError({
        req,
        res,
        statusCode: 400,
        message: 'Cannot delete result with revaluation requests. Archive instead.',
      });
    }

    await Marksheet.findOneAndDelete({ result: resultId });
    await Result.findByIdAndDelete(resultId);

    return sendSuccess({ req, res, message: 'Result deleted successfully', data: null });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const publishResult = async (req: Request, res: Response) => {
  try {
    const resultId = req.params.id;
    const userId = req.user._id;

    const result = await Result.findById(resultId);
    if (!result) {
      return sendError({ req, res, statusCode: 404, message: 'Result not found' });
    }

    result.isPublished = true;
    result.publishedDate = new Date();

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 10);
    result.revaluationDeadline = deadline;
    result.isRevaluationActive = true;

    result.auditHistory.push({
      action: 'PUBLISHED',
      performedBy: userId,
      timestamp: new Date(),
    });

    await result.save();

    if (result.resultStatus === 'PASS') {
      const student = await Student.findById(result.student);
      if (student) {
        const certNumber = `PC-${result.academicYear}-${Date.now().toString(36).toUpperCase()}`;
        await pdfGeneratorService.generateProvisionalCertificatePDF({
          student,
          result,
          certNumber,
        });
      }
    }

    return sendSuccess({ req, res, message: 'Result published successfully', data: result });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const searchResults = async (req: Request, res: Response) => {
  try {
    const { q, academicYear, semester, department, resultStatus, fromDate, toDate } = req.query;

    const searchResultsData = await resultService.advancedSearch({
      query: q,
      academicYear,
      semester,
      department,
      resultStatus,
      fromDate,
      toDate,
    });

    return sendSuccess({ req, res, message: 'Search results retrieved successfully', data: searchResultsData });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const getResultStatistics = async (req: Request, res: Response) => {
  try {
    const { academicYear, semester } = req.query;

    const statistics = await resultService.getResultStatistics({ academicYear, semester });

    return sendSuccess({ req, res, message: 'Statistics retrieved successfully', data: statistics });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const bulkUploadResults = async (req: Request, res: Response) => {
  try {
    const validatedData = bulkUploadSchema.parse(req.body);
    const userId = req.user._id;

    const uploadedResults = await resultService.bulkUpload(validatedData.results, userId);

    return sendSuccess({
      req,
      res,
      statusCode: 201,
      message: `${uploadedResults.length} results uploaded successfully`,
      data: uploadedResults,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) throw error;
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// Schema for file-based bulk upload
const fileBulkUploadSchema = z.object({
  academicYear: z.string().min(1, 'Academic year is required'),
  semester: z.coerce.number().int().min(1).max(8, 'Semester must be between 1 and 8'),
  format: z.enum(['docx', 'pdf', 'xlsx', 'csv']),
});

export const bulkUploadFromFile = async (req: Request, res: Response) => {
  try {
    const { academicYear, semester, format } = fileBulkUploadSchema.parse(req.body);
    const file = req.file;

    if (!file) {
      return sendError({ req, res, statusCode: 400, message: 'No file uploaded' });
    }

    let parsedResults: ParsedResultData[] = [];
    const buffer = file.buffer;

    try {
      switch (format) {
        case 'docx':
          parsedResults = await fileParserService.parseDocx(buffer);
          break;
        case 'pdf':
          parsedResults = await fileParserService.parsePdf(buffer);
          break;
        case 'xlsx':
        case 'csv':
          parsedResults = await fileParserService.parseExcel(buffer);
          break;
        default:
          return sendError({ req, res, statusCode: 400, message: 'Unsupported file format' });
      }
    } catch (parseError: any) {
      return sendError({ req, res, statusCode: 400, message: `Failed to parse file: ${parseError.message}` });
    }

    if (parsedResults.length === 0) {
      return sendError({
        req,
        res,
        statusCode: 400,
        message: 'No valid student records found in the uploaded file. Please check the file format and try again.',
      });
    }

    const enrollmentIds = parsedResults.map(r => r.studentId);
    const students = await Student.find({
      enrollmentId: { $in: enrollmentIds }
    });

    const studentMap = new Map();
    students.forEach(s => {
      studentMap.set(s.enrollmentId, s._id);
    });

    const resultsToUpload: any[] = [];
    const skippedStudents: string[] = [];

    for (const result of parsedResults) {
      const studentId = studentMap.get(result.studentId);
      if (!studentId) {
        skippedStudents.push(result.studentId);
        continue;
      }

      const subjects = result.subjects.map((s: any) => ({
        ...s,
        totalMarks: s.internalMarks + s.externalMarks,
        grade: calculateGrade(s.internalMarks + s.externalMarks),
        gradePoints: getGradePoints(s.internalMarks + s.externalMarks),
      }));

      resultsToUpload.push({
        student: studentId,
        academicYear: academicYear || result.academicYear || '2024-25',
        semester: semester || result.semester || 1,
        subjects,
      });
    }

    if (resultsToUpload.length === 0) {
      return sendError({
        req,
        res,
        statusCode: 400,
        message: 'No valid student records found. Ensure enrollment IDs match existing students.',
        errors: skippedStudents.length > 0 ? [`Skipped students: ${skippedStudents.join(', ')}`] : [],
      });
    }

    const uploaded = await resultService.bulkUpload(resultsToUpload, req.user._id);

    return sendSuccess({
      req,
      res,
      statusCode: 201,
      message: `${uploaded.length} results uploaded successfully from file`,
      data: {
        total: parsedResults.length,
        uploaded: uploaded.length,
        skipped: parsedResults.length - uploaded.length,
        skippedStudents,
        uploadedResults: uploaded,
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError({ req, res, statusCode: 400, message: 'Validation failed', errors: error.issues });
    }
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

function calculateGrade(marks: number): string {
  if (marks >= 90) return 'O';
  if (marks >= 80) return 'A+';
  if (marks >= 70) return 'A';
  if (marks >= 60) return 'B+';
  if (marks >= 50) return 'B';
  if (marks >= 40) return 'C';
  if (marks >= 35) return 'D';
  return 'F';
}

function getGradePoints(marks: number): number {
  if (marks >= 90) return 10;
  if (marks >= 80) return 9;
  if (marks >= 70) return 8;
  if (marks >= 60) return 7;
  if (marks >= 50) return 6;
  if (marks >= 40) return 5;
  if (marks >= 35) return 4;
  return 0;
}

export const downloadMarksheet = async (req: Request, res: Response) => {
  try {
    const resultId = req.params.id;

    const marksheet = await Marksheet.findOne({ result: resultId });
    if (!marksheet) {
      return sendError({ req, res, statusCode: 404, message: 'Marksheet not found' });
    }

    marksheet.downloadedCount += 1;
    marksheet.lastDownloaded = new Date();
    await marksheet.save();

    return sendSuccess({
      req,
      res,
      message: 'Marksheet retrieved successfully',
      data: {
        marksheetNumber: marksheet.marksheetNumber,
        downloadUrl: marksheet.marksheetPDF,
        version: marksheet.version,
      },
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const getStudentResultHistory = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const results = await Result.find({ student: studentId, isPublished: true })
      .select('academicYear semester totalMarks percentage cgpa division resultStatus')
      .sort({ academicYear: -1, semester: -1 });

    if (!results || results.length === 0) {
      return sendError({ req, res, statusCode: 404, message: 'No results found for this student' });
    }

    return sendSuccess({ req, res, message: 'Student result history retrieved successfully', data: results });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};
