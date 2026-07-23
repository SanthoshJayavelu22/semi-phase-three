import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRevaluationSubject {
  subjectCode: string;
  subjectName: string;
  originalMarks: number;
  originalGrade: string;
  internalMarks: number;
  externalMarks: number;
  revaluationReason: string;
}

export interface IAdminComment {
  comment: string;
  commentedBy: Types.ObjectId;
  timestamp: Date;
}

export interface IAuditTrailEntry {
  action: string;
  previousStatus: string;
  newStatus: string;
  performedBy: Types.ObjectId;
  timestamp: Date;
}

export interface IRevaluationRequest extends Document {
  requestId: string;
  institute: Types.ObjectId;
  student: Types.ObjectId;
  result: Types.ObjectId;
  academicYear: string;
  semester: number;
  subjects: IRevaluationSubject[];
  feePerSubject: number;
  totalFee: number;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentId?: string;
  paymentDate?: Date;
  status: 'PENDING' | 'UNDER_REVIEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  submittedDate: Date;
  reviewDeadline?: Date;
  assignedEvaluator?: Types.ObjectId;
  evaluatorComments?: string;
  evaluatedDate?: Date;
  revaluationResults: Types.ObjectId[];
  finalResult: 'CHANGED' | 'UNCHANGED' | 'PENDING';
  adminComments: IAdminComment[];
  auditTrail: IAuditTrailEntry[];
}

const revaluationRequestSchema: Schema = new Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
    },
    institute: {
      type: Schema.Types.ObjectId,
      ref: 'Institute',
      required: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    result: {
      type: Schema.Types.ObjectId,
      ref: 'Result',
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    subjects: [
      {
        subjectCode: { type: String, required: true },
        subjectName: { type: String, required: true },
        originalMarks: { type: Number, required: true },
        originalGrade: { type: String, required: true },
        internalMarks: { type: Number, required: true },
        externalMarks: { type: Number, required: true },
        revaluationReason: { type: String, required: true },
      },
    ],
    feePerSubject: { type: Number, required: true },
    totalFee: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    paymentId: { type: String },
    paymentDate: { type: Date },
    status: {
      type: String,
      enum: ['PENDING', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
    },
    submittedDate: { type: Date, default: Date.now },
    reviewDeadline: { type: Date },
    assignedEvaluator: { type: Schema.Types.ObjectId, ref: 'User' },
    evaluatorComments: { type: String },
    evaluatedDate: { type: Date },
    revaluationResults: [{ type: Schema.Types.ObjectId, ref: 'RevaluationResult' }],
    finalResult: {
      type: String,
      enum: ['CHANGED', 'UNCHANGED', 'PENDING'],
      default: 'PENDING',
    },
    adminComments: [
      {
        comment: String,
        commentedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    auditTrail: [
      {
        action: String,
        previousStatus: String,
        newStatus: String,
        performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

revaluationRequestSchema.index({ student: 1, status: 1 });
revaluationRequestSchema.index({ institute: 1, academicYear: 1 });

export const RevaluationRequest = mongoose.model<IRevaluationRequest>('RevaluationRequest', revaluationRequestSchema);
