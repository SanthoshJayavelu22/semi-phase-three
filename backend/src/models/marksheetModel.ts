import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMarksheetVersion {
  version: number;
  marksheetPDF: string;
  generatedDate: Date;
  reason: string;
}

export interface IMarksheet extends Document {
  student: Types.ObjectId;
  academicYear: string;
  semester: number;
  result: Types.ObjectId;
  marksheetNumber: string;
  marksheetPDF: string;
  isFinal: boolean;
  version: number;
  previousVersions: IMarksheetVersion[];
  generatedDate: Date;
  downloadedCount: number;
  lastDownloaded?: Date;
}

const marksheetSchema: Schema = new Schema(
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
    result: {
      type: Schema.Types.ObjectId,
      ref: 'Result',
      required: true,
    },
    marksheetNumber: {
      type: String,
      required: true,
      unique: true,
    },
    marksheetPDF: {
      type: String,
      required: true,
    },
    isFinal: {
      type: Boolean,
      default: false,
    },
    version: {
      type: Number,
      default: 1,
    },
    previousVersions: [
      {
        version: Number,
        marksheetPDF: String,
        generatedDate: Date,
        reason: String,
      },
    ],
    generatedDate: {
      type: Date,
      default: Date.now,
    },
    downloadedCount: {
      type: Number,
      default: 0,
    },
    lastDownloaded: {
      type: Date,
    },
  },
  { timestamps: true }
);

marksheetSchema.index({ student: 1, academicYear: 1, semester: 1 });

export const Marksheet = mongoose.model<IMarksheet>('Marksheet', marksheetSchema);
