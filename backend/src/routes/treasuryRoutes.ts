import express from 'express';
import { getTreasurySummary } from '../controllers/treasuryController';
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/summary', protect, authorize('admin', 'super_admin', 'board'), getTreasurySummary);

export default router;
