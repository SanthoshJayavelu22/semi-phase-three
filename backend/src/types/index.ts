// backend/src/types/index.ts
export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'institute_admin' | 'academy_admin' | 'student';
  isEmailVerified: boolean;
  verificationToken?: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInstitute {
  _id: string;
  user: string;
  orgName: string;
  constitutionType: string;
  hospitalName?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  applicationStatus: 'Pending' | 'Approved' | 'Rejected' | 'PaymentPending';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IStudent {
  _id: string;
  enrollmentId: string;
  enrollmentNo?: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  instituteId: string;
  courseId: string;
  batchId: string;
  isEligible: boolean;
  academicMetrics?: {
    attendancePercentage?: number;
    thesisApproved?: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: any[];
}
