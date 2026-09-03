import mongoose, { Document, Schema } from 'mongoose';

export interface IFeeRecord extends Document {
  student: mongoose.Types.ObjectId;
  examinationNumber?: number;
  amount: number;
  paymentMode: string;
  utrNumber?: string;
  paymentReceiptUrl?: string;
  paymentDate: Date;
  paymentPurpose: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

const feeRecordSchema: Schema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    examinationNumber: {
      type: Number,
      required: false,
      enum: [1, 2],
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMode: {
      type: String,
      required: true,
    },
    utrNumber: {
      type: String,
    },
    paymentReceiptUrl: {
      type: String,
      default: 'Online Verification',
    },
    paymentDate: {
      type: Date,
      required: true,
    },
    paymentPurpose: {
      type: String,
      required: true,
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const FeeRecord = mongoose.model<IFeeRecord>('FeeRecord', feeRecordSchema);
