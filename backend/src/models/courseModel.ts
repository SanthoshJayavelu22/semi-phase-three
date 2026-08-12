import mongoose, { Document, Schema } from 'mongoose';

export interface ISemesterSubject {
  code?: string;
  name: string;
}

export interface ISemesterPractical {
  code?: string;
  name: string;
}

export interface ISemesterCourse {
  semesterNumber: number;
  semesterName?: string;
  subjects?: ISemesterSubject[];
  practicalExams?: ISemesterPractical[];
}

export interface ICourse extends Document {
  institute: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  courseCode?: string;
  courseType?: string;
  programCategory?: string;
  courseDuration?: string;
  durationType?: string;
  subjects?: string[];
  practicalExamName?: string;
  practicalExams?: string[];
  semesters?: ISemesterCourse[];
  examinationFee?: string;
  status?: 'Active' | 'Inactive' | 'Pending';
}

const courseSchema: Schema = new Schema(
  {
    institute: {
      type: Schema.Types.ObjectId,
      ref: 'Institute',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
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
    semesters: {
      type: [
        {
          semesterNumber: { type: Number, required: true },
          semesterName: { type: String, default: '' },
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
    examinationFee: {
      type: String,
      default: '15,000',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Pending'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

// Unique course name per institute
courseSchema.index({ institute: 1, name: 1 }, { unique: true });

export const Course = mongoose.model<ICourse>('Course', courseSchema);