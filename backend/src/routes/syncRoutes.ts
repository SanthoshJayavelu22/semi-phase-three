import { Router } from 'express';
import { getEntityTimestamps } from '../controllers/syncController';

const router = Router();

router.get('/timestamps', getEntityTimestamps);

export default router;
