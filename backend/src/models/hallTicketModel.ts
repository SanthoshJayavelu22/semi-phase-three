// backend/src/models/hallTicketModel.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IHallTicket extends Document {
  // Legacy / Direct snapshot fields
  ticketId?: string;
  examApplication?: mongoose.Types.ObjectId;
  student?: mongoose.Types.ObjectId;
  enrollmentId?: string;
  studentName?: string;
  contactNumber?: string;
  photoUrl?: string;
  instituteName?: string;
  instituteAddress?: string;
  courseName?: string;
  batchYear?: number;
  subjects?: string[];
  examDate?: Date;
  examVenue?: string;
  examCenter?: string;
  reportingTime?: string;
  isDownloaded?: boolean;
  downloadedAt?: Date;

  // Rich Template & Config fields
  hallTicketNumber?: string;
  examType?: 'CCT-EM' | 'Basic Sciences' | 'Final Year' | 'Custom';
  candidate?: {
    name: string;
    signature?: string;
    photo?: string;
    enrollmentId: string;
  };
  institute?: any;
  examDetails?: {
    theory?: {
      centre: string;
      address?: string;
      subjects: Array<{
        date: Date;
        paperName: string;
        paperNumber?: number;
        appearing?: boolean;
        invigilatorSignature?: string;
      }>;
      timeSlot?: string;
    };
    practical?: {
      centre?: string;
      address?: string;
      date?: Date;
      appearing?: boolean;
      timeSlot?: string;
      coordinatorSignature?: string;
    };
  };
  template?: {
    id: string;
    name: string;
    sections?: Array<{
      type: 'header' | 'candidate' | 'exam' | 'instructions' | 'footer';
      order?: number;
      content?: any;
    }>;
  };
  customFields?: Map<string, any>;
  validFrom?: Date;
  validUntil?: Date;
  status?: 'draft' | 'published' | 'cancelled';
  issuedBy?: mongoose.Types.ObjectId;
  metadata?: {
    generatedAt?: Date;
    generatedBy?: string;
    version?: string;
  };
}

const HallTicketSchema = new Schema({
  ticketId: { type: String, sparse: true },
  examApplication: { type: Schema.Types.ObjectId, ref: 'ExamApplication' },
  student: { type: Schema.Types.ObjectId, ref: 'Student' },
  enrollmentId: { type: String },
  studentName: { type: String },
  contactNumber: { type: String },
  photoUrl: { type: String },
  instituteName: { type: String },
  instituteAddress: { type: String },
  courseName: { type: String },
  batchYear: { type: Number },
  subjects: { type: [Schema.Types.Mixed] },
  examDate: { type: Date },
  examVenue: { type: String },
  examCenter: { type: String },
  reportingTime: { type: String },
  isDownloaded: { type: Boolean, default: false },
  downloadedAt: { type: Date },

  hallTicketNumber: { type: String },
  examType: { type: String, enum: ['CCT-EM', 'Basic Sciences', 'Final Year', 'Custom'] },
  candidate: {
    name: { type: String },
    signature: { type: String },
    photo: { type: String },
    enrollmentId: { type: String }
  },
  institute: { type: Schema.Types.Mixed },
  examDetails: { type: Schema.Types.Mixed },
  template: { type: Schema.Types.Mixed },
  customFields: { type: Map, of: Schema.Types.Mixed },
  validFrom: { type: Date, default: Date.now },
  validUntil: { type: Date },
  status: { type: String, enum: ['draft', 'published', 'cancelled'], default: 'draft' },
  issuedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  metadata: {
    generatedAt: { type: Date, default: Date.now },
    generatedBy: { type: String },
    version: { type: String, default: '1.0' }
  }
}, { timestamps: true });

export const HallTicket = mongoose.model<IHallTicket>('HallTicket', HallTicketSchema);