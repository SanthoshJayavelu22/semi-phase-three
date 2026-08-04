// backend/src/utils/errorHandler.ts
import { Request, Response } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleError = (err: any, req: Request, res: Response) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError' && err.errors) {
    const messages = Object.values(err.errors).map((e: any) => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', '),
    });
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000 && err.keyPattern) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // Log unexpected errors
  console.error('Unexpected error:', err);

  return res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};
