import { Router } from 'express';
import userRoutes from '../userRoutes';
import healthRoutes from '../healthRoutes';
import authRoutes from '../authRoutes';
import instituteRoutes from '../instituteRoutes';
import academicRoutes from '../academicRoutes';
import examRoutes from '../examRoutes';
import resultRoutes from '../resultRoutes';
import revaluationRoutes from '../revaluationRoutes';
import marksheetRoutes from '../marksheetRoutes';
import certificateRoutes from '../certificateRoutes';
import paymentRoutes from '../paymentRoutes';
import marksRoutes from '../marksRoutes';
import hallTicketRoutes from '../hallTicketRoutes';
import syncRoutes from '../syncRoutes';

const router = Router();

router.use('/users', userRoutes);
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/institutes', instituteRoutes);
router.use('/academic', academicRoutes);
router.use('/exams', examRoutes);
router.use('/results', resultRoutes);
router.use('/revaluation', revaluationRoutes);
router.use('/marksheets', marksheetRoutes);
router.use('/certificates', certificateRoutes);
router.use('/marks', marksRoutes);
router.use('/hall-tickets', hallTicketRoutes);
router.use('/sync', syncRoutes);
router.use('/', paymentRoutes);

export default router;
