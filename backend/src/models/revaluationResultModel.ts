import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRevaluationResult extends Document {
  revaluationRequest: Types.ObjectId;
  student: Types.ObjectId;
  result: Types.ObjectId;
  subjectCode: string;
  subjectName: string;
  originalMarks: number;
  originalGrade: string;
  revisedInternalMarks?: number;
  revisedExternalMarks?: number;
  revisedTotalMarks?: number;
  revisedGrade?: 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F' | 'ABSENT';
  marksChange: number;
  evaluatorComments?: string;
  reviewedBy?: Types.ObjectId;
  reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PARTIALLY_APPROVED';
  reviewedDate?: Date;
  isFinal: boolean;
  previousVersionData?: any;
}

const revaluationResultSchema: Schema = new Schema(
  {
    revaluationRequest: {
      type: Schema.Types.ObjectId,
      ref: 'RevaluationRequest',
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
    subjectCode: {
      type: String,
      required: true,
    },
    subjectName: {
      type: String,
      required: true,
    },
    originalMarks: {
      type: Number,
      required: true,
    },
    originalGrade: {
      type: String,
      required: true,
    },
    revisedInternalMarks: {
      type: Number,
      min: 0,
      max: 100,
    },
    revisedExternalMarks: {
      type: Number,
      min: 0,
      max: 100,
    },
    revisedTotalMarks: {
      type: Number,
      min: 0,
      max: 100,
    },
    revisedGrade: {
      type: String,
      enum: ['O', 'A+', 'A', 'B+', 'B', 'C', 'D', 'F', 'ABSENT'],
    },
    marksChange: {
      type: Number,
      default: 0,
    },
    evaluatorComments: {
      type: String,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'PARTIALLY_APPROVED'],
      default: 'PENDING',
    },
    reviewedDate: {
      type: Date,
    },
    isFinal: {
      type: Boolean,
      default: false,
    },
    previousVersionData: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

revaluationResultSchema.index({ revaluationRequest: 1, subjectCode: 1 });
revaluationResultSchema.index({ student: 1, result: 1 });

export const RevaluationResult = mongoose.model<IRevaluationResult>('RevaluationResult', revaluationResultSchema);
