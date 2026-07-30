import express from 'express';
import { checkPaymentStatusPublic } from '../controllers/paymentController';

const router = express.Router();

router.get('/payment/status/:orderId', checkPaymentStatusPublic);

export default router;