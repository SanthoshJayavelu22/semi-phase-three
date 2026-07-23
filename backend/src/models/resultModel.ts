import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISubjectResult {
  subjectCode: string;
  subjectName: string;
  internalMarks: number;
  externalMarks: number;
  totalMarks: number;
  grade: 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F' | 'ABSENT';
  credits: number;
  gradePoints: number;
  isRevaluationApplied: boolean;
  revaluationMarks?: number;
  revaluationGrade?: 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F' | 'ABSENT';
  isRevaluationCompleted: boolean;
}

export interface IAuditEntry {
  action: 'CREATED' | 'UPDATED' | 'PUBLISHED' | 'REVALUATION_UPDATED';
  previousData?: any;
  newData?: any;
  performedBy: Types.ObjectId;
  timestamp: Date;
}

export interface IResult extends Document {
  student: Types.ObjectId;
  academicYear: string;
  semester: number;
  subjects: ISubjectResult[];
  totalMarks: number;
  totalCredits: number;
  percentage: number;
  cgpa: number;
  sgpa: number;
  division: 'First' | 'Second' | 'Third' | 'Pass' | 'Fail';
  resultStatus: 'PASS' | 'FAIL' | 'SUPPLEMENTARY' | 'REVALUATION_PENDING';
  isPublished: boolean;
  publishedDate?: Date;
  isRevaluationActive: boolean;
  revaluationDeadline?: Date;
  revaluationRequests: Types.ObjectId[];
  auditHistory: IAuditEntry[];
}

const resultSchema: Schema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
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
        internalMarks: { type: Number, default: 0, min: 0, max: 100 },
        externalMarks: { type: Number, default: 0, min: 0, max: 100 },
        totalMarks: { type: Number, min: 0, max: 100 },
        grade: {
          type: String,
          enum: ['O', 'A+', 'A', 'B+', 'B', 'C', 'D', 'F', 'ABSENT'],
          default: 'F',
        },
        credits: { type: Number, required: true, min: 1, max: 6 },
        gradePoints: { type: Number, min: 0, max: 10 },
        isRevaluationApplied: { type: Boolean, default: false },
        revaluationMarks: { type: Number, min: 0, max: 100 },
        revaluationGrade: {
          type: String,
          enum: ['O', 'A+', 'A', 'B+', 'B', 'C', 'D', 'F', 'ABSENT'],
        },
        isRevaluationCompleted: { type: Boolean, default: false },
      },
    ],
    totalMarks: { type: Number, required: true },
    totalCredits: { type: Number, required: true },
    percentage: { type: Number, required: true },
    cgpa: { type: Number, required: true },
    sgpa: { type: Number, required: true },
    division: {
      type: String,
      enum: ['First', 'Second', 'Third', 'Pass', 'Fail'],
      required: true,
    },
    resultStatus: {
      type: String,
      enum: ['PASS', 'FAIL', 'SUPPLEMENTARY', 'REVALUATION_PENDING'],
      required: true,
    },
    isPublished: { type: Boolean, default: false },
    publishedDate: { type: Date },
    isRevaluationActive: { type: Boolean, default: false },
    revaluationDeadline: { type: Date },
    revaluationRequests: [{ type: Schema.Types.ObjectId, ref: 'RevaluationRequest' }],
    auditHistory: [
      {
        action: {
          type: String,
          enum: ['CREATED', 'UPDATED', 'PUBLISHED', 'REVALUATION_UPDATED'],
          required: true,
        },
        previousData: { type: Schema.Types.Mixed },
        newData: { type: Schema.Types.Mixed },
        performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

resultSchema.index({ student: 1, academicYear: 1, semester: 1 });
resultSchema.index({ 'subjects.subjectCode': 1 });
resultSchema.index({ resultStatus: 1 });
resultSchema.index({ isPublished: 1 });

export const Result = mongoose.model<IResult>('Result', resultSchema);
