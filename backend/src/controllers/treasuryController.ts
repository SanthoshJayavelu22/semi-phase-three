import { Request, Response } from 'express';
import { FeeRecord } from '../models/feeRecordModel';
import { Institute } from '../models/instituteModel';
import { Remittance } from '../models/remittanceModel';
import { RevaluationRequest } from '../models/revaluationRequestModel';
import { sendSuccess, sendError } from '../utils/responseFormatter';
import { getFeeCategory, getFeeCategoryLabel } from '../utils/feeCategories';

export const getTreasurySummary = async (req: Request, res: Response) => {
  try {
    // 1. Get all fee records with proper categorization
    const feeRecords = await FeeRecord.find({})
      .populate({ path: 'student', select: 'firstName lastName enrollmentId email institute', populate: { path: 'institute', select: 'orgName' } })
      .sort({ createdAt: -1 });

    // 2. Get all institute onboarding payments
    const institutes = await Institute.find({ paymentStatus: 'Completed', isDeleted: { $ne: true } })
      .populate('user', 'name email');

    // 3. Get all remittance records
    const remittances = await Remittance.find({})
      .populate('institute', 'orgName')
      .populate('students', 'firstName lastName enrollmentId');

    // 4. Get revaluation requests with payments
    const revaluations = await RevaluationRequest.find({ paymentStatus: 'PAID' })
      .populate('student', 'firstName lastName enrollmentId')
      .populate('institute', 'orgName');

    const transactions: any[] = [];

    // Add fee records
    feeRecords.forEach(record => {
      const student = record.student as any;
      const purpose = record.paymentPurpose || 'Fee Payment';
      const category = getFeeCategory(purpose);
      transactions.push({
        id: `FEE-${record._id}`,
        rawId: record._id,
        refNo: record._id.toString().substring(0, 8).toUpperCase(),
        category,
        categoryLabel: getFeeCategoryLabel(category),
        paymentPurpose: purpose,
        remarks: purpose,
        amount: record.amount || 0,
        paymentId: record.razorpayPaymentId || record.utrNumber || 'N/A',
        orderId: record.razorpayOrderId || 'N/A',
        paymentMode: record.paymentMode || 'Online',
        paymentDate: record.paymentDate ? new Date(record.paymentDate).toISOString().split('T')[0] : 'N/A',
        timestamp: record.paymentDate ? new Date(record.paymentDate).getTime() : (record as any).createdAt ? new Date((record as any).createdAt).getTime() : Date.now(),
        status: 'Verified',
        instituteName: student?.institute?.orgName || 'Accredited Center',
        instituteId: student?.institute?._id || student?.institute || undefined,
        payerName: student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : 'N/A',
        studentName: student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : 'N/A',
        studentEnrollmentId: student?.enrollmentId || 'N/A',
        examinationNumber: record.examinationNumber,
        isFeeRecord: true,
        isRemittance: false,
        isOnboarding: false,
        isRevaluation: false,
      });
    });

    // Add institute onboarding payments
    institutes.forEach(inst => {
      const user = inst.user as any;
      const paymentDate = inst.paymentCompletedAt || (inst as any).createdAt;
      transactions.push({
        id: `ONB-${inst._id}`,
        rawId: inst._id,
        refNo: inst._id.toString().substring(0, 8).toUpperCase(),
        category: 'ONBOARDING',
        categoryLabel: 'Institute Onboarding',
        paymentPurpose: 'Institute Onboarding & Inspection Fee',
        remarks: `Onboarding inspection fee for ${inst.orgName}`,
        amount: inst.paymentAmount || 5000,
        paymentId: inst.razorpayPaymentId || 'N/A',
        orderId: inst.razorpayOrderId || 'N/A',
        paymentMode: 'Razorpay Gateway',
        paymentDate: paymentDate ? new Date(paymentDate).toISOString().split('T')[0] : 'N/A',
        timestamp: paymentDate ? new Date(paymentDate).getTime() : Date.now(),
        status: 'Verified',
        instituteName: inst.orgName || 'N/A',
        instituteId: inst._id,
        payerName: user?.name || inst.orgName || 'N/A',
        studentName: 'N/A',
        studentEnrollmentId: 'N/A',
        isFeeRecord: false,
        isRemittance: false,
        isOnboarding: true,
        isRevaluation: false,
      });
    });

    // Add remittance records
    remittances.forEach(rem => {
      const institute = rem.institute as any;
      transactions.push({
        id: `REM-${rem._id}`,
        rawId: rem._id,
        refNo: rem._id.toString().substring(0, 8).toUpperCase(),
        category: 'REMITTANCE',
        categoryLabel: 'Academy Remittance',
        paymentPurpose: rem.paymentPurpose || 'Annual Fellowship Accreditation Remittance',
        remarks: rem.remarks || 'Annual Institute Remittance',
        amount: rem.totalAmount || 0,
        paymentId: rem.razorpayPaymentId || rem.utrNumber || 'N/A',
        orderId: rem.razorpayOrderId || 'N/A',
        paymentMode: rem.paymentMode || 'Razorpay Online',
        paymentDate: rem.paymentDate ? new Date(rem.paymentDate).toISOString().split('T')[0] : 'N/A',
        timestamp: rem.paymentDate ? new Date(rem.paymentDate).getTime() : Date.now(),
        status: 'Verified',
        instituteName: institute?.orgName || 'N/A',
        instituteId: institute?._id || rem.institute,
        payerName: institute?.orgName || 'N/A',
        studentName: 'N/A',
        studentEnrollmentId: 'N/A',
        studentCount: rem.students?.length || 0,
        isFeeRecord: false,
        isRemittance: true,
        isOnboarding: false,
        isRevaluation: false,
      });
    });

    // Add revaluation payments
    revaluations.forEach(rev => {
      const student = rev.student as any;
      const institute = rev.institute as any;
      transactions.push({
        id: `REV-${rev._id}`,
        rawId: rev._id,
        refNo: rev.requestId || rev._id.toString().substring(0, 8).toUpperCase(),
        category: 'REVALUATION',
        categoryLabel: 'Revaluation Fee',
        paymentPurpose: 'Answer Script Revaluation Fee',
        remarks: `Revaluation for ${rev.subjects?.length || 1} subject(s)`,
        amount: rev.totalFee || 0,
        paymentId: rev.paymentId || 'N/A',
        orderId: rev.paymentOrderId || 'N/A',
        paymentMode: 'Razorpay Gateway',
        paymentDate: rev.paymentDate ? new Date(rev.paymentDate).toISOString().split('T')[0] : 'N/A',
        timestamp: rev.paymentDate ? new Date(rev.paymentDate).getTime() : Date.now(),
        status: 'Verified',
        instituteName: institute?.orgName || 'Academic Center',
        instituteId: institute?._id || rev.institute,
        payerName: student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : 'Fellow Candidate',
        studentName: student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : 'N/A',
        studentEnrollmentId: student?.enrollmentId || 'N/A',
        examinationNumber: rev.examination,
        subjectsCount: rev.subjects?.length || 0,
        isFeeRecord: false,
        isRemittance: false,
        isOnboarding: false,
        isRevaluation: true,
      });
    });

    // Sort by timestamp descending
    transactions.sort((a, b) => b.timestamp - a.timestamp);

    // Calculate totals by category
    const categoryTotals: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    transactions.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    });

    return sendSuccess({
      req,
      res,
      message: 'Treasury summary retrieved successfully',
      data: {
        transactions,
        summary: {
          totalTransactions: transactions.length,
          totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
          categoryTotals,
          categoryCounts,
        },
      },
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};
