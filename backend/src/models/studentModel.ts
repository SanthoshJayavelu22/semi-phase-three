import mongoose, { Document, Schema } from 'mongoose';

export interface IStudent extends Document {
  enrollmentId: string;
  firstName: string;
  lastName: string;
  homeAddress: string;
  contactNumber: string;
  email: string;
  qualification: string;
  mbbsQualification: string;
  yearOfPassing: number;
  universityName: string;
  medicalCouncilRegistrationNumber: string;
  isForeignGraduate: boolean;
  dateOfBirth?: Date;
  fmgeClearanceStatus?: 'Cleared' | 'Not Applicable' | 'Failed';
  course: mongoose.Types.ObjectId;
  batch: mongoose.Types.ObjectId;
  institute: mongoose.Types.ObjectId;
  courseDirector: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  documents: {
    passportPhotoUrl: string;
    mbbsCertificateUrl: string;
    medicalCouncilRegistrationCertificateUrl: string;
    fmgeResultCopyUrl?: string;
    semiMembershipFormUrl: string;
    studentSignatureUrl?: string;
    hodSignatureUrl?: string;
  };
  remittedToAcademy: boolean;
  remittanceRecord?: mongoose.Types.ObjectId;
  semesters: {
    semesterNumber: number;
    attendancePercentage: number;
    thesisDocumentUrl?: string;
    thesisApproved: boolean;
    eligibilityStatus: 'Pending' | 'Approved' | 'Rejected';
    marks?: {
      subjectCode: string;
      subjectName: string;
      marksObtained: number | null;
      totalMarks: number;
      isAbsent: boolean;
      grade: string;
      updatedBy?: mongoose.Types.ObjectId;
      updatedAt?: Date;
    }[];
  }[];
}

const studentSchema: Schema = new Schema(
  {
    enrollmentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    homeAddress: {
      type: String,
      required: true,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    qualification: {
      type: String,
      required: true,
    },
    mbbsQualification: {
      type: String,
      required: true,
    },
    yearOfPassing: {
      type: Number,
      required: true,
    },
    universityName: {
      type: String,
      required: true,
    },
    medicalCouncilRegistrationNumber: {
      type: String,
      required: true,
    },
    isForeignGraduate: {
      type: Boolean,
      required: true,
      default: false,
    },
    dateOfBirth: {
      type: Date,
      required: false,
    },
    fmgeClearanceStatus: {
      type: String,
      enum: ['Cleared', 'Not Applicable', 'Failed'],
      default: 'Not Applicable',
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
    institute: {
      type: Schema.Types.ObjectId,
      ref: 'Institute',
      required: true,
    },
    courseDirector: {
      type: String,
      required: true,
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    documents: {
      passportPhotoUrl: { type: String, required: true },
      mbbsCertificateUrl: { type: String, required: true },
      medicalCouncilRegistrationCertificateUrl: { type: String, required: true },
      fmgeResultCopyUrl: { type: String },
      semiMembershipFormUrl: { type: String, required: true },
      studentSignatureUrl: { type: String },
      hodSignatureUrl: { type: String },
    },
    remittedToAcademy: {
      type: Boolean,
      required: true,
      default: false,
    },
    remittanceRecord: {
      type: Schema.Types.ObjectId,
      ref: 'Remittance',
    },
    semesters: [
      {
        semesterNumber: { type: Number, required: true },
        attendancePercentage: { type: Number, required: true, default: 0, min: 0, max: 100 },
        thesisDocumentUrl: { type: String },
        thesisApproved: { type: Boolean, required: true, default: false },
        eligibilityStatus: { 
          type: String, 
          enum: ['Pending', 'Approved', 'Rejected'], 
          default: 'Pending' 
        },
        marks: [
          {
            subjectCode: { type: String, required: true },
            subjectName: { type: String, required: true },
            marksObtained: { type: Number, default: null },
            totalMarks: { type: Number, default: 100 },
            isAbsent: { type: Boolean, default: false },
            grade: { type: String, default: '' },
            updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
            updatedAt: { type: Date, default: Date.now },
          },
        ],
      }
    ],
  },
  {
    timestamps: true,
  }
);

export const Student = mongoose.model<IStudent>('Student', studentSchema);
