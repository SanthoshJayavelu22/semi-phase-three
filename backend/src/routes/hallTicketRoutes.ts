// backend/src/routes/hallTicketRoutes.ts
import express from 'express';
import hallTicketController from '../controllers/hallTicketController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { uploadMiddleware } from '../middlewares/uploadMiddleware';

const router = express.Router();

// Protected routes
router.use(authMiddleware);

// Hall ticket management
router.post('/create', hallTicketController.createHallTicket);
router.get('/:id', hallTicketController.getHallTicket);
router.get('/:id/pdf', hallTicketController.generatePDF);

// Template management
router.get('/templates', hallTicketController.getTemplates);
router.post('/templates', hallTicketController.createCustomTemplate);
router.put('/templates/:id', hallTicketController.updateTemplate);

export default router;