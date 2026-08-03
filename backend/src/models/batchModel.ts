import mongoose, { Document, Schema } from 'mongoose';

export interface IBatch extends Document {
  institute: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  year: number;
  name: string;
  startDate: Date;
  seats: number;
  activeFellows: number;
  status: 'Active' | 'Inactive' | 'Completed';
}

const batchSchema: Schema = new Schema(
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
    year: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    seats: {
      type: Number,
      default: 5,
      min: 1,
    },
    activeFellows: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Completed'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

// Unique batch name per course (allows multiple batches like Batch 2026-A, Batch 2026-B in the same year)
batchSchema.index({ course: 1, name: 1 }, { unique: true });

export const Batch = mongoose.model<IBatch>('Batch', batchSchema);