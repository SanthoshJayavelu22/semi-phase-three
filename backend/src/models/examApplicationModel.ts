import mongoose, { Document, Schema } from 'mongoose';

export interface IExamApplication extends Document {
  institute: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  batch: mongoose.Types.ObjectId;
  examinationNumber: number;
  students: mongoose.Types.ObjectId[];
  subjects: string[];

  // Status lifecycle: Pending → Approved → SchedulePublished | Rejected
  status: 'Pending' | 'Approved' | 'SchedulePublished' | 'Rejected';

  // Set during Review (Approve step)
  scheduledDate?: Date;
  remarks?: string;

  // Set during Publish Schedule step
  examVenue?: string;
  examCenter?: string;
  reportingTime?: string;
  schedulePublishedAt?: Date;
  subjectSchedules?: { subject: string; date: Date; time: string }[];

  // NEW: Practical exam details
  practicalExam?: {
    name: string;
    venue: string;
    date?: Date;
    time: string;
    subjects: string[];
  };

  // Hall ticket tracking
  hallTicketsGenerated: boolean;
  hallTicketsGeneratedAt?: Date;

  // Exam fee payment (now optional as fee is collected elsewhere)
  utrNumber?: string;
  examFeeReceiptUrl?: string;

  // NEW: Fee applicability tracking (first-time vs reappearing students)
  examFeeApplicable?: boolean;
  examFeeAmount?: number;
  reappearingFeeAmount?: number;
  firstAttemptFeeAmount?: number;
  reappearingStudents?: mongoose.Types.ObjectId[];
  firstAttemptStudents?: mongoose.Types.ObjectId[];
}

const examApplicationSchema: Schema = new Schema(
  {
    institute: {
      type: Schema.Types.ObjectId,
      ref: 'Institute',
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    batch: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
    },
    examinationNumber: {
      type: Number,
      required: true,
      enum: [1, 2],
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
      },
    ],
    subjects: {
      type: [String],
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'SchedulePublished', 'Rejected'],
      default: 'Pending',
    },

    // Review step
    scheduledDate: { type: Date },
    remarks: { type: String },

    // Publish Schedule step
    examVenue:           { type: String },
    examCenter:          { type: String },
    reportingTime:       { type: String },
    schedulePublishedAt: { type: Date },
    subjectSchedules: [
      {
        subject: { type: String, required: true },
        date: { type: Date, required: true },
        time: { type: String, required: true }
      }
    ],

    // NEW: Practical exam details
    practicalExam: {
      name:     { type: String },
      venue:    { type: String },
      date:     { type: Date },
      time:     { type: String },
      subjects: { type: [String] }
    },

    // Hall ticket tracking
    hallTicketsGenerated:   { type: Boolean, default: false },
    hallTicketsGeneratedAt: { type: Date },

    // Exam fee payment
    utrNumber: {
      type: String,
      required: false,
    },
    examFeeReceiptUrl: {
      type: String,
      required: false,
    },

    // Fee applicability tracking
    examFeeApplicable: { type: Boolean, default: false },
    examFeeAmount: { type: Number, default: 0 },
    reappearingFeeAmount: { type: Number, default: 0 },
    firstAttemptFeeAmount: { type: Number, default: 0 },
    reappearingStudents: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
    firstAttemptStudents: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
  },
  { timestamps: true }
);

// Batch-level compound indexes for efficient lookups and querying
examApplicationSchema.index({ institute: 1, course: 1, batch: 1, examinationNumber: 1 });
examApplicationSchema.index({ batch: 1, examinationNumber: 1, status: 1 });

export const ExamApplication = mongoose.model<IExamApplication>('ExamApplication', examApplicationSchema);
