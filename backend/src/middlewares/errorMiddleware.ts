import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/responseFormatter';

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Log full stack trace for unhandled errors
  console.error(`🔥 Unhandled Error at [${req.method} ${req.originalUrl}]:`, err);
  
  const errors = err.errors || [];
  
  if (err.name === 'ZodError') {
    const zodIssues = err.errors ?? err.issues ?? [];

    return sendError({
      req,
      res,
      statusCode: 400,
      message: 'Validation failed',
      errors: zodIssues.map((e: any) => ({
        field: (e.path || []).join('.'),
        code: e.code,
        message: e.message
      }))
    });
  }

  // Multer / Cloudinary upload errors should be client errors, not 500s
  if (
    err.name === 'MulterError' ||
    (err.code && typeof err.code === 'string' && err.code.startsWith('LIMIT_')) ||
    typeof err.http_code === 'number'
  ) {
    let message;
    if (err.name === 'MulterError') {
      switch (err.code) {
        case 'LIMIT_FILE_SIZE':
          message = 'File is too large. Maximum allowed size is 10MB.';
          break;
        case 'LIMIT_UNEXPECTED_FILE':
          message = 'Unexpected file field encountered in upload payload.';
          break;
        case 'LIMIT_FILE_COUNT':
          message = 'Too many files uploaded for this field.';
          break;
        default:
          message = `Upload error: ${err.message}`;
      }
    } else if (typeof err.http_code === 'number') {
      message = `Cloudinary Upload Failure: ${err.message || 'Image processing error'}`;
    } else {
      const raw = err.message || '';
      if (/unknown file format|format not allowed|not allowed/i.test(raw)) {
        message = 'This file could not be uploaded. Please check the file format and try again.';
      } else {
        message = err.message || 'Upload failed. Please check the file and try again.';
      }
    }
    return sendError({ req, res, statusCode: 400, message, errors: [] });
  }

  sendError({
    req,
    res,
    statusCode,
    message: err.message || 'Internal Server Error',
    errors: process.env.NODE_ENV === 'production' ? [] : [{ message: err.message, stack: err.stack, ...errors }]
  });
};
