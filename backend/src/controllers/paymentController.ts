import { Request, Response } from 'express';
import { Institute } from '../models/instituteModel';
import { FeeRecord } from '../models/feeRecordModel';
import { sendSuccess, sendError } from '../utils/responseFormatter';

export const checkPaymentStatusPublic = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { type = 'institute' } = req.query;

    if (type === 'institute') {
      const institute = await Institute.findOne({ razorpayOrderId: orderId });
      if (!institute) {
        return sendError({ req, res, statusCode: 404, message: 'Order not found' });
      }
      return sendSuccess({
        req,
        res,
        message: 'Payment status retrieved',
        data: {
          paymentStatus: institute.paymentStatus,
          razorpayPaymentId: institute.razorpayPaymentId,
          orderId: institute.razorpayOrderId,
        },
      });
    } else if (type === 'academic') {
      const feeRecord = await FeeRecord.findOne({
        $or: [{ razorpayPaymentId: orderId }, { utrNumber: orderId }],
      });
      return sendSuccess({
        req,
        res,
        message: 'Payment status retrieved',
        data: {
          paymentStatus: feeRecord ? 'Completed' : 'Pending',
          paymentId: feeRecord?.razorpayPaymentId || feeRecord?.utrNumber,
        },
      });
    }

    return sendError({ req, res, statusCode: 400, message: 'Invalid payment type' });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};