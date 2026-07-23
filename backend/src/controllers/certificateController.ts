import { Request, Response } from 'express';
import { z } from 'zod';
import { Certificate } from '../models/certificateModel';
import { Result } from '../models/resultModel';
import { Student } from '../models/studentModel';
import certificateService from '../services/certificateService';
import pdfGeneratorService from '../services/pdfGeneratorService';
import { sendSuccess, sendError } from '../utils/responseFormatter';
import { issueCertificateSchema, updateCertificateSchema } from '../validators/certificateValidator';

export const generateProvisionalCertificate = async (req: Request, res: Response) => {
  try {
    const { studentId, resultId } = req.body;
    const userId = req.user._id;

    if (!studentId || !resultId) {
      return sendError({ req, res, statusCode: 400, message: 'studentId and resultId are required' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return sendError({ req, res, statusCode: 404, message: 'Student not found' });
    }

    const result = await Result.findById(resultId);
    if (!result) {
      return sendError({ req, res, statusCode: 404, message: 'Result not found' });
    }

    if (result.resultStatus !== 'PASS') {
      return sendError({ req, res, statusCode: 400, message: 'Certificate can only be generated for passed students' });
    }

    const existingCert = await Certificate.findOne({
      student: studentId,
      result: resultId,
      type: 'PROVISIONAL',
    });

    if (existingCert) {
      return sendError({ req, res, statusCode: 400, message: 'Provisional certificate already exists for this result' });
    }

    const certNumber = await certificateService.generateCertificateNumber('PROVISIONAL');
    const pdfUrl = await pdfGeneratorService.generateProvisionalCertificatePDF({ student, result, certNumber });

    const certificate = await Certificate.create({
      student: studentId,
      certificateNumber: certNumber,
      type: 'PROVISIONAL',
      academicYear: result.academicYear,
      semester: result.semester,
      result: resultId,
      certificatePDF: pdfUrl,
      issuedDate: new Date(),
      auditTrail: [{
        action: 'CERTIFICATE_GENERATED',
        performedBy: userId,
        timestamp: new Date(),
      }],
    });

    return sendSuccess({ req, res, statusCode: 201, message: 'Provisional certificate generated successfully', data: certificate });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const issueCertificate = async (req: Request, res: Response) => {
  try {
    const validatedData = issueCertificateSchema.parse(req.body);
    const userId = req.user._id;

    const student = await Student.findById(validatedData.student);
    if (!student) {
      return sendError({ req, res, statusCode: 404, message: 'Student not found' });
    }

    if (validatedData.result) {
      const result = await Result.findById(validatedData.result);
      if (!result) {
        return sendError({ req, res, statusCode: 404, message: 'Result not found' });
      }
    }

    const certificateNumber = await certificateService.generateCertificateNumber(validatedData.type);

    const certificate = await Certificate.create({
      ...validatedData,
      certificateNumber,
      issuedDate: new Date(),
      auditTrail: [{
        action: 'CERTIFICATE_ISSUED',
        performedBy: userId,
        timestamp: new Date(),
      }],
    });

    return sendSuccess({ req, res, statusCode: 201, message: 'Certificate issued successfully', data: certificate });
  } catch (error: any) {
    if (error instanceof z.ZodError) throw error;
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const getAllCertificates = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', type, academicYear, studentId, isVerified } = req.query;

    const query: any = {};
    if (type) query.type = type;
    if (academicYear) query.academicYear = academicYear;
    if (studentId) query.student = studentId;
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';

    const options = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      populate: [
        { path: 'student', select: 'firstName lastName enrollmentId email' },
        { path: 'result', select: 'academicYear semester totalMarks percentage' },
      ],
      sort: { createdAt: -1 } as any,
    };

    const certificates = await certificateService.getCertificatesWithPagination(query, options);

    return sendSuccess({ req, res, message: 'Certificates retrieved successfully', data: certificates });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const getCertificateById = async (req: Request, res: Response) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('student', 'firstName lastName enrollmentId email')
      .populate('result', 'academicYear semester totalMarks percentage cgpa division')
      .populate('verifiedBy', 'name email');

    if (!certificate) {
      return sendError({ req, res, statusCode: 404, message: 'Certificate not found' });
    }

    return sendSuccess({ req, res, message: 'Certificate retrieved successfully', data: certificate });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const verifyCertificate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const certificate = await Certificate.findById(id);
    if (!certificate) {
      return sendError({ req, res, statusCode: 404, message: 'Certificate not found' });
    }

    certificate.isVerified = true;
    certificate.verifiedBy = userId;
    certificate.verifiedDate = new Date();

    certificate.auditTrail.push({
      action: 'CERTIFICATE_VERIFIED',
      performedBy: userId,
      timestamp: new Date(),
    });

    await certificate.save();

    return sendSuccess({ req, res, message: 'Certificate verified successfully', data: certificate });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const revokeCertificate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    const certificate = await Certificate.findById(id);
    if (!certificate) {
      return sendError({ req, res, statusCode: 404, message: 'Certificate not found' });
    }

    certificate.isRevoked = true;
    certificate.revocationReason = reason || 'No reason provided';

    certificate.auditTrail.push({
      action: 'CERTIFICATE_REVOKED',
      performedBy: userId,
      timestamp: new Date(),
    });

    await certificate.save();

    return sendSuccess({ req, res, message: 'Certificate revoked successfully', data: certificate });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const downloadCertificate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const certificate = await Certificate.findById(id);
    if (!certificate) {
      return sendError({ req, res, statusCode: 404, message: 'Certificate not found' });
    }

    certificate.downloadedCount += 1;
    await certificate.save();

    return sendSuccess({
      req,
      res,
      message: 'Certificate download initiated',
      data: {
        certificateNumber: certificate.certificateNumber,
        downloadUrl: certificate.certificatePDF,
        isVerified: certificate.isVerified,
        qrCode: certificate.qrCode,
      },
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const deleteCertificate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const certificate = await Certificate.findById(id);
    if (!certificate) {
      return sendError({ req, res, statusCode: 404, message: 'Certificate not found' });
    }

    await Certificate.findByIdAndDelete(id);

    return sendSuccess({ req, res, message: 'Certificate deleted successfully', data: null });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const getStudentCertificates = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const certificates = await Certificate.find({ student: studentId, isRevoked: false })
      .populate('result', 'academicYear semester totalMarks percentage cgpa division')
      .sort({ issuedDate: -1 });

    if (!certificates || certificates.length === 0) {
      return sendError({ req, res, statusCode: 404, message: 'No certificates found for this student' });
    }

    return sendSuccess({ req, res, message: 'Student certificates retrieved successfully', data: certificates });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const updateCertificate = async (req: Request, res: Response) => {
  try {
    const validatedData = updateCertificateSchema.parse(req.body);

    const certificate = await Certificate.findByIdAndUpdate(
      req.params.id,
      { $set: validatedData },
      { new: true, runValidators: true }
    )
      .populate('student', 'firstName lastName enrollmentId email');

    if (!certificate) {
      return sendError({ req, res, statusCode: 404, message: 'Certificate not found' });
    }

    return sendSuccess({ req, res, message: 'Certificate updated successfully', data: certificate });
  } catch (error: any) {
    if (error instanceof z.ZodError) throw error;
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};
