import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICertificateAuditEntry {
  action: string;
  performedBy: Types.ObjectId;
  timestamp: Date;
}

export interface ICertificate extends Document {
  student: Types.ObjectId;
  certificateNumber: string;
  type: 'PROVISIONAL' | 'CONSOLIDATED' | 'DUPLICATE' | 'TRANSFER';
  academicYear: string;
  semester?: number;
  result?: Types.ObjectId;
  certificatePDF: string;
  isVerified: boolean;
  verifiedBy?: Types.ObjectId;
  verifiedDate?: Date;
  issuedDate: Date;
  expiryDate?: Date;
  qrCode?: string;
  blockchainHash?: string;
  isRevoked: boolean;
  revocationReason?: string;
  downloadedCount: number;
  auditTrail: ICertificateAuditEntry[];
}

const certificateSchema: Schema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['PROVISIONAL', 'CONSOLIDATED', 'DUPLICATE', 'TRANSFER'],
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    semester: {
      type: Number,
      min: 1,
      max: 8,
    },
    result: {
      type: Schema.Types.ObjectId,
      ref: 'Result',
    },
    certificatePDF: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedDate: {
      type: Date,
    },
    issuedDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
    },
    qrCode: {
      type: String,
    },
    blockchainHash: {
      type: String,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    revocationReason: {
      type: String,
    },
    downloadedCount: {
      type: Number,
      default: 0,
    },
    auditTrail: [
      {
        action: String,
        performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

certificateSchema.index({ student: 1, certificateNumber: 1 });
certificateSchema.index({ type: 1, academicYear: 1 });
certificateSchema.index({ qrCode: 1 });

export const Certificate = mongoose.model<ICertificate>('Certificate', certificateSchema);
