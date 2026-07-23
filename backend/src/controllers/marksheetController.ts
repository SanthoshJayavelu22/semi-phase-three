import { Request, Response } from 'express';
import { Marksheet } from '../models/marksheetModel';
import { Result } from '../models/resultModel';
import marksheetService from '../services/marksheetService';
import pdfGeneratorService from '../services/pdfGeneratorService';
import { sendSuccess, sendError } from '../utils/responseFormatter';

export const generateMarksheet = async (req: Request, res: Response) => {
  try {
    const { resultId } = req.body;

    if (!resultId) {
      return sendError({ req, res, statusCode: 400, message: 'resultId is required' });
    }

    const result = await Result.findById(resultId).populate('student');
    if (!result) {
      return sendError({ req, res, statusCode: 404, message: 'Result not found' });
    }

    const existingMarksheet = await Marksheet.findOne({ result: resultId });
    if (existingMarksheet) {
      return sendError({ req, res, statusCode: 400, message: 'Marksheet already exists for this result' });
    }

    const student = result.student as any;
    const marksheetNumber = await marksheetService.generateMarksheetNumber();
    const pdfUrl = await pdfGeneratorService.generateMarksheetPDF({
      result,
      student,
      marksheetNumber,
    });

    const marksheet = await Marksheet.create({
      student: student._id,
      academicYear: result.academicYear,
      semester: result.semester,
      result: resultId,
      marksheetNumber,
      marksheetPDF: pdfUrl,
      isFinal: true,
      generatedDate: new Date(),
    });

    return sendSuccess({ req, res, statusCode: 201, message: 'Marksheet generated successfully', data: marksheet });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const getAllMarksheets = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', studentId, academicYear, semester } = req.query;

    const query: any = {};
    if (studentId) query.student = studentId;
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = parseInt(semester as string);

    const options = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      populate: [
        { path: 'student', select: 'firstName lastName enrollmentId email' },
        { path: 'result', select: 'academicYear semester totalMarks percentage' },
      ],
      sort: { createdAt: -1 } as any,
    };

    const marksheets = await marksheetService.getMarksheetsWithPagination(query, options);

    return sendSuccess({ req, res, message: 'Marksheets retrieved successfully', data: marksheets });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const getMarksheetById = async (req: Request, res: Response) => {
  try {
    const marksheet = await Marksheet.findById(req.params.id)
      .populate('student', 'firstName lastName enrollmentId email')
      .populate('result', 'academicYear semester subjects totalMarks percentage cgpa sgpa division');

    if (!marksheet) {
      return sendError({ req, res, statusCode: 404, message: 'Marksheet not found' });
    }

    return sendSuccess({ req, res, message: 'Marksheet retrieved successfully', data: marksheet });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const updateMarksheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const marksheet = await Marksheet.findById(id);
    if (!marksheet) {
      return sendError({ req, res, statusCode: 404, message: 'Marksheet not found' });
    }

    const previousVersion = {
      version: marksheet.version,
      marksheetPDF: marksheet.marksheetPDF,
      generatedDate: marksheet.generatedDate,
      reason: updateData.updateReason || 'Version update',
    };

    Object.keys(updateData).forEach((key) => {
      if (key !== 'updateReason' && key !== 'regeneratePDF') {
        (marksheet as any)[key] = updateData[key];
      }
    });

    marksheet.version += 1;
    marksheet.previousVersions.push(previousVersion);

    if (updateData.regeneratePDF) {
      const result = await Result.findById(marksheet.result).populate('student');
      if (result) {
        const student = result.student as any;
        const pdfUrl = await pdfGeneratorService.generateMarksheetPDF({
          result,
          student,
          marksheetNumber: marksheet.marksheetNumber,
        });
        marksheet.marksheetPDF = pdfUrl;
      }
    }

    await marksheet.save();

    return sendSuccess({ req, res, message: 'Marksheet updated successfully', data: marksheet });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const deleteMarksheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const marksheet = await Marksheet.findById(id);
    if (!marksheet) {
      return sendError({ req, res, statusCode: 404, message: 'Marksheet not found' });
    }

    await Marksheet.findByIdAndDelete(id);

    return sendSuccess({ req, res, message: 'Marksheet deleted successfully', data: null });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const downloadMarksheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const marksheet = await Marksheet.findById(id);
    if (!marksheet) {
      return sendError({ req, res, statusCode: 404, message: 'Marksheet not found' });
    }

    marksheet.downloadedCount += 1;
    marksheet.lastDownloaded = new Date();
    await marksheet.save();

    return sendSuccess({
      req,
      res,
      message: 'Marksheet download initiated',
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

export const getStudentMarksheets = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const marksheets = await Marksheet.find({ student: studentId })
      .populate('result', 'academicYear semester subjects totalMarks percentage cgpa sgpa division')
      .sort({ academicYear: -1, semester: -1 });

    if (!marksheets || marksheets.length === 0) {
      return sendError({ req, res, statusCode: 404, message: 'No marksheets found for this student' });
    }

    return sendSuccess({ req, res, message: 'Student marksheets retrieved successfully', data: marksheets });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const bulkGenerateMarksheets = async (req: Request, res: Response) => {
  try {
    const { resultIds } = req.body;

    if (!resultIds || !Array.isArray(resultIds) || resultIds.length === 0) {
      return sendError({ req, res, statusCode: 400, message: 'Please provide an array of result IDs' });
    }

    const generated = await marksheetService.bulkGenerate(resultIds);

    return sendSuccess({
      req,
      res,
      statusCode: 201,
      message: `${generated.length} marksheets generated successfully`,
      data: generated,
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};
