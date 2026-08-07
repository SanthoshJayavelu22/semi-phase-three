import { Request, Response } from 'express';
import { cacheService } from '../services/cacheService';
import { sendSuccess } from '../utils/responseFormatter';

export const getEntityTimestamps = async (req: Request, res: Response) => {
  try {
    const timestamps = await cacheService.getAllTimestamps();
    return sendSuccess({
      req,
      res,
      message: 'Entity change timestamps retrieved',
      data: timestamps,
    });
  } catch (error: any) {
    return res.status(200).json({
      success: true,
      data: {
        institutes: Date.now(),
        students: Date.now(),
        exams: Date.now(),
        results: Date.now(),
        revaluation: Date.now(),
        marks: Date.now(),
        courses: Date.now(),
        batches: Date.now(),
      },
    });
  }
};
