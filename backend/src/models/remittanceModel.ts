import mongoose, { Document, Schema } from 'mongoose';

export interface IRemittance extends Document {
  institute: mongoose.Types.ObjectId;
  totalAmount: number;
  paymentPurpose?: string;
  remarks?: string;
  utrNumber?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentMode?: string;
  paymentDate: Date;
  paymentReceiptUrl?: string;
  students: mongoose.Types.ObjectId[];
}

const remittanceSchema: Schema = new Schema(
  {
    institute: {
      type: Schema.Types.ObjectId,
      ref: 'Institute',
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentPurpose: {
      type: String,
      default: 'Annual Fellowship Accreditation Remittance',
    },
    remarks: {
      type: String,
      default: '',
    },
    utrNumber: {
      type: String,
      default: '',
    },
    razorpayOrderId: {
      type: String,
      default: '',
    },
    razorpayPaymentId: {
      type: String,
      default: '',
    },
    razorpaySignature: {
      type: String,
      default: '',
    },
    paymentMode: {
      type: String,
      default: 'Razorpay Online',
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paymentReceiptUrl: {
      type: String,
      default: '',
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Remittance = mongoose.model<IRemittance>('Remittance', remittanceSchema);
