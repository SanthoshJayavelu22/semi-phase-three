import mongoose, { Document, Schema } from 'mongoose';

export interface IExaminationSubject {
  code?: string;
  name: string;
}

export interface IExaminationPractical {
  code?: string;
  name: string;
}

export interface IExaminationCourse {
  examinationNumber: number;
  examinationName?: string;
  monthsRequired?: number;
  subjects?: IExaminationSubject[];
  practicalExams?: IExaminationPractical[];
}

export interface IExamFeeConfig {
  firstAttemptFee: number;
  reappearingFee: number;
  feeApplicableForFirstAttempt: boolean;
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt?: Date;
}

export interface ICourse extends Document {
  institute?: mongoose.Types.ObjectId;
  name: string;
  courseCode?: string;
  courseType?: string;
  programCategory?: string;
  courseDuration?: string;
  durationType?: string;
  subjects?: string[];
  practicalExamName?: string;
  practicalExams?: string[];
  examinations?: IExaminationCourse[];
  status?: 'Active' | 'Inactive' | 'Pending';
  examFeeConfig?: {
    [examKey: string]: IExamFeeConfig;
  };
  examinationFee?: number;
  reappearingExaminationFee?: number;
  feeApplicableForFirstAttempt?: boolean;
}

const courseSchema: Schema = new Schema(
  {
    institute: {
      type: Schema.Types.ObjectId,
      ref: 'Institute',
      required: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    courseCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    courseType: {
      type: String,
      enum: ['Undergraduate', 'Postgraduate', 'Diploma', 'Fellowship'],
      default: 'Postgraduate',
    },
    programCategory: {
      type: String,
      default: 'Emergency Medicine',
    },
    courseDuration: {
      type: String,
      default: '2',
    },
    durationType: {
      type: String,
      enum: ['Years', 'Months', 'Weeks'],
      default: 'Years',
    },
    subjects: {
      type: [String],
      default: [],
    },
    practicalExamName: {
      type: String,
      default: 'Clinical OSCE & Practical Station Exam',
    },
    practicalExams: {
      type: [String],
      default: [],
    },
    examinations: {
      type: [
        {
          examinationNumber: { type: Number, required: true },
          examinationName: { type: String, default: '' },
          monthsRequired: { type: Number, default: 0 },
          subjects: [
            {
              code: { type: String, default: '' },
              name: { type: String, required: true },
            },
          ],
          practicalExams: [
            {
              code: { type: String, default: '' },
              name: { type: String, required: true },
            },
          ],
        },
      ],
      default: [],
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Pending'],
      default: 'Active',
    },
    examinationFee: {
      type: Number,
      default: 0,
    },
    reappearingExaminationFee: {
      type: Number,
      default: 0,
    },
    feeApplicableForFirstAttempt: {
      type: Boolean,
      default: false,
    },
    examFeeConfig: {
      type: Map,
      of: new Schema(
        {
          firstAttemptFee: { type: Number, default: 0 },
          reappearingFee: { type: Number, default: 0 },
          feeApplicableForFirstAttempt: { type: Boolean, default: false },
          updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
          updatedAt: { type: Date, default: Date.now },
        },
        { _id: false }
      ),
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Unique course name index (global)
courseSchema.index({ name: 1 }, { unique: true });

export const Course = mongoose.model<ICourse>('Course', courseSchema);