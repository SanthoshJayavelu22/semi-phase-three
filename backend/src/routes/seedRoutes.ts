import { Router, Request, Response } from 'express';
import { seedAllData } from '../config/seed';
import { sendSuccess, sendError } from '../utils/responseFormatter';

const router = Router();

router.all('/', async (req: Request, res: Response) => {
  try {
    const force = req.query.force === 'true' || req.body?.force === true;
    const summary = await seedAllData({ force });
    return sendSuccess({
      req,
      res,
      message: 'All dummy data for Academy and Institute seeded successfully! 🎉',
      data: summary,
    });
  } catch (err: any) {
    return sendError({ req, res, statusCode: 500, message: err.message });
  }
});

export default router;
