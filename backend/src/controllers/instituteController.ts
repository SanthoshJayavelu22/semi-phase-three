import { Request, Response } from 'express';
import { Institute } from '../models/instituteModel';
import { User } from '../models/userModel';
import { sendSuccess, sendError } from '../utils/responseFormatter';
import { z } from 'zod';
import sendEmail from '../utils/sendEmail';
import razorpayInstance, { keyId } from '../config/razorpay';
import crypto from 'crypto';
import path from 'path'; 

const getFileUrl = (filePath: string) => {
  if (!filePath) return '';
  // Cloudinary (or any external/absolute) URLs are returned as-is so the stored
  // link points directly at the CDN and works from any environment.
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  // Local uploads are stored as an origin-agnostic relative path so the
  // frontend can resolve them against whichever backend origin it is talking to
  // (localhost in dev, the production domain in prod).
  const filename = path.basename(filePath).replace(/\\/g, '/');
  return `/api/uploads/${filename}`;
};

const instituteSchema = z.object({
  orgName: z.string().min(1, 'Organization Name is required'),
  constitutionType: z.enum(['University', 'State Government', 'Autonomous Body', 'Union Territory', 'Society', 'Trust', 'Society / Trust']),
  instituteAddress: z.string().min(1, 'Institute Address is required'),
  registeredOfficeAddress: z.string().min(1, 'Registered Office Address is required'),
  phoneNumber: z.string().regex(/^[0-9]{6,15}$/, 'Must be a valid phone or landline number format'),
  emailAddress: z.string().email('Invalid email format'),
  commencementDate: z.string().transform(val => new Date(val)),
  seatsRequested: z.coerce.number().min(1, 'Numeric value only'),
  officePhone: z.string().optional().or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  headName: z.string().min(1, 'Head of Institution Name is required'),
  headDesignation: z.string().min(1, 'Head of Institution Designation is required'),
  hodName: z.string().min(1, 'Head of Department Name is required'),
  bedCount: z.coerce.number().min(10, 'Minimum 10 beds mandatory'),
  physicianAvailability: z.enum(['Yes', 'No']),
  physicianExperience: z.coerce.number().min(24, 'Minimum 24 months required'),
  courseDirectorEMQualified: z.enum(['Yes', 'No']),
  emFacultyCount: z.coerce.number().min(1, 'Required'),
  teachingSpace: z.enum(['Yes', 'No']),
  nabhStatus: z.enum(['Yes', 'No']),
  authorizedRepName: z.string().optional().or(z.literal('')),
  authorizedRepDesignation: z.string().optional().or(z.literal('')),
  applicationDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  cityAndState: z.string().optional(),
  pincode: z.string().optional(),
  contactNumbers: z.string().optional(),
  emailId: z.string().optional().or(z.literal('')),
  razorpayPaymentId: z.string().optional().or(z.literal('')),
  razorpayOrderId: z.string().optional().or(z.literal('')),
  razorpaySignature: z.string().optional().or(z.literal('')),
  paymentStatus: z.enum(['Pending', 'Completed']).optional(),
});

export const applyInstitute = async (req: Request, res: Response) => {
  try {
    const validatedData = instituteSchema.parse(req.body);


    const existingApplication = await Institute.findOne({ user: req.user._id });
    if (existingApplication) {
      if (existingApplication.status === 'Rejected') {
        await Institute.deleteOne({ _id: existingApplication._id });
      } else {
        return sendError({ req, res, statusCode: 400, message: 'Application already exists for this user' });
      }
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    
    const getSafeFileUrl = (field: string) => {
      if (files && files[field] && files[field].length > 0 && files[field][0].path) {
        return getFileUrl(files[field][0].path);
      }
      return `/api/uploads/mock_${field}.pdf`;
    };

    const newInstitute = await Institute.create({
      user: req.user._id,
      ...validatedData,
      facultyCommitmentLetterUrl: getSafeFileUrl('facultyCommitmentLetter'),
      documents: {
        equipmentListUrl: getSafeFileUrl('equipmentList'),
        facultyListUrl: getSafeFileUrl('facultyList'),
        emergencyOPDStatisticsUrl: getSafeFileUrl('emergencyOPDStatistics'),
        libraryBookListUrl: getSafeFileUrl('libraryBookList'),
        trainingMannequinListUrl: getSafeFileUrl('trainingMannequinList'),
        diagnosticEquipmentListUrl: getSafeFileUrl('diagnosticEquipmentList'),
        declarationLetterUrl: getSafeFileUrl('declarationLetter'),
        inspectionPaymentReceiptUrl: getSafeFileUrl('inspectionPaymentReceipt'),
        applicantSignatureUrl: getSafeFileUrl('applicantSignature'),
        hodSignatureAndSealUrl: getSafeFileUrl('hodSignatureAndSeal'),
        headOfInstitutionSignatureAndSealUrl: getSafeFileUrl('headOfInstitutionSignatureAndSeal'),
      },
      status: 'Pending Review',
      paymentStatus: validatedData.paymentStatus || 'Pending',
      razorpayOrderId: validatedData.razorpayOrderId || '',
      razorpayPaymentId: validatedData.razorpayPaymentId || '',
      razorpaySignature: validatedData.razorpaySignature || '',
      paymentCompletedAt: validatedData.paymentStatus === 'Completed' ? new Date() : undefined,
      paymentAmount: validatedData.paymentStatus === 'Completed' ? 5000 : undefined,
    });

    // Send Submission Confirmation email to the institute
    try {
      await sendEmail({
        email: req.user.email,
        subject: 'Institute Onboarding Application Submitted - Semi Phase 3',
        message: `Hello ${req.user.name},\n\nYour application for onboarding the institute "${newInstitute.orgName}" has been successfully submitted and is currently in "Pending Review" status.\n\nPlease proceed to submit the inspection fee payment to advance your application to board review.\n\nThank you,\nSemi Phase 3 Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #0146d8; text-align: center;">Application Submitted Successfully</h2>
            <p>Hello <strong>${req.user.name}</strong>,</p>
            <p>Thank you for submitting your application. We have successfully registered your institute details.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0146d8;">
              <h3 style="margin-top: 0; color: #333;">Application Summary</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px 0; color: #666; font-weight: bold; width: 40%;">Organization Name:</td>
                  <td style="padding: 5px 0; color: #333;">${newInstitute.orgName}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #666; font-weight: bold;">Reference Status:</td>
                  <td style="padding: 5px 0; color: #e67e22; font-weight: bold;">${newInstitute.status}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #666; font-weight: bold;">Payment Status:</td>
                  <td style="padding: 5px 0; color: #e74c3c; font-weight: bold;">${newInstitute.paymentStatus}</td>
                </tr>
              </table>
            </div>

            <p><strong>Next Step:</strong> Before your application can be reviewed by the Academic Board, you must complete the application inspection fee payment. Please log in to your portal and proceed with the payment.</p>
            
            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999999; text-align: center;">This is an automated notification. Please do not reply directly to this email.</p>
          </div>
        `
      });
    } catch (emailErr: any) {
      console.error(' ', emailErr.message);
    }

    return sendSuccess({
      req,
      res,
      statusCode: 201,
      message: 'Institute application submitted successfully',
      data: newInstitute,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError || error.name === 'ZodError') {
      return sendError({
        req,
        res,
        statusCode: 400,
        message: 'Validation failed',
        errors: error.errors?.map((e: any) => ({
          field: (e.path || []).join('.'),
          code: e.code,
          message: e.message
        })) || []
      });
    }
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const createRazorpayOrder = async (req: Request, res: Response) => {
  try {
    const institute = await Institute.findOne({ user: req.user._id });
    console.log('🔍 Creating order for institute:', institute ? institute._id : 'Not found (Pay & Submit flow)');

    if (institute && institute.paymentStatus === 'Completed') {
      return sendError({ req, res, statusCode: 400, message: 'Payment has already been completed for this application.' });
    }

    const AMOUNT_INR = 5000;
    const AMOUNT_PAISE = AMOUNT_INR * 100; // 500000 paise

    const options = {
      amount: AMOUNT_PAISE,
      currency: 'INR',
      receipt: `receipt_inst_${(institute ? institute._id : req.user._id).toString().substring(0, 10)}_${Date.now()}`,
    };

    const order = await razorpayInstance.orders.create(options);
    console.log('✅ Order created:', order.id);

    if (institute) {
      institute.razorpayOrderId = order.id;
      institute.paymentAmount = AMOUNT_INR;
      await institute.save();
      console.log('✅ Order ID saved to institute:', institute.razorpayOrderId);
    } else {
      console.log('⚠️ No institute yet — orderId will be passed with payment verification');
    }

    return sendSuccess({
      req,
      res,
      statusCode: 201,
      message: 'Razorpay order created successfully',
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: keyId,
      },
    });
  } catch (error: any) {
    console.error('❌ Order creation error:', error);
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};
  
export const verifyRazorpayPayment = async (req: Request, res: Response) => {
  try {
    const institute = await Institute.findOne({ user: req.user._id });
    console.log('🔍 Verifying payment for institute:', institute ? institute._id : 'Not found');

    if (institute && institute.paymentStatus === 'Completed') {
      console.log('✅ Payment already completed for institute:', institute._id);
      return sendSuccess({
        req,
        res,
        message: 'Payment already completed',
        data: {
          paymentStatus: 'Completed',
          institute
        }
      });
    }

    const { 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature,
      paymentId
    } = req.body;

    const orderIdToVerify = razorpay_order_id || (institute ? institute.razorpayOrderId : undefined);
    const paymentIdToVerify = razorpay_payment_id || paymentId;

    console.log('📦 Payment verification data:', { orderIdToVerify, paymentIdToVerify, hasSignature: !!razorpay_signature });

    if (!paymentIdToVerify) {
      return sendError({ req, res, statusCode: 400, message: 'Payment ID is required' });
    }

    if (!razorpay_signature || !razorpay_order_id) {
      return sendError({ 
        req, 
        res, 
        statusCode: 400, 
        message: 'Razorpay order ID, payment ID, and signature are mandatory for verification.' 
      });
    }

    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(text)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return sendError({ req, res, statusCode: 400, message: 'Payment verification failed. Invalid signature.' });
    }

    const receiptNumber = 'REC-' + Math.floor(10000000 + Math.random() * 90000000);

    if (institute) {
      institute.paymentStatus = 'Completed';
      institute.razorpayOrderId = razorpay_order_id;
      institute.razorpayPaymentId = paymentIdToVerify;
      institute.razorpaySignature = razorpay_signature;
      institute.paymentCompletedAt = new Date();
      if (!institute.paymentAmount) {
        institute.paymentAmount = 5000;
      }
      console.log('🔄 Updating institute payment data:', {
        paymentStatus: institute.paymentStatus,
        razorpayOrderId: institute.razorpayOrderId,
        razorpayPaymentId: institute.razorpayPaymentId,
      });
      await institute.save();
      console.log('✅ Institute payment data saved successfully');
    } else {
      console.warn('⚠️ No institute found to update payment data. The apply step will create it with payment info.');
    }

    // Send email notifications only if institute exists
    if (institute) {
      try {
        await sendEmail({
          email: req.user.email,
          subject: 'Payment Receipt Confirmation - Semi Phase 3',
          message: `Hello ${req.user.name},\n\nWe have successfully received your payment.\nReceipt Number: ${receiptNumber}\nPayment ID: ${paymentIdToVerify}\nOrder ID: ${orderIdToVerify}\nAmount: INR 5,000.00\nStatus: Completed\n\nYour application has been moved to the Academic Board for review.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h2 style="color: #2ecc71; text-align: center;">Payment Receipt Confirmation</h2>
              <p>Hello <strong>${req.user.name}</strong>,</p>
              <p>We are pleased to confirm that we have successfully processed your inspection fee payment. Your application is now ready for the Academic Board review.</p>
              
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2ecc71;">
                <h3 style="margin-top: 0; color: #333;">Receipt Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0; color: #666; font-weight: bold; width: 45%;">Receipt Number:</td>
                    <td style="padding: 5px 0; color: #333; font-family: monospace;">${receiptNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; color: #666; font-weight: bold;">Order ID:</td>
                    <td style="padding: 5px 0; color: #333; font-family: monospace;">${orderIdToVerify}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; color: #666; font-weight: bold;">Transaction / Payment ID:</td>
                    <td style="padding: 5px 0; color: #333; font-family: monospace;">${paymentIdToVerify}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; color: #666; font-weight: bold;">Amount Paid:</td>
                    <td style="padding: 5px 0; color: #333;">INR 5,000.00</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; color: #666; font-weight: bold;">Status:</td>
                    <td style="padding: 5px 0; color: #2ecc71; font-weight: bold;">Paid / Completed</td>
                  </tr>
                </table>
              </div>
              
              <p>The Academic Board will review your application details, uploaded documents, and schedule an inspection if required. We will keep you notified of any updates.</p>
              
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #999999; text-align: center;">This is an automated receipt email. Please keep this for your records.</p>
            </div>
          `
        });
      } catch (emailErr: any) {
        console.error('Payment receipt email sending failed:', emailErr.message);
      }

      try {
        const boardEmail = process.env.BOARD_EMAIL || 'admin@semiphase3.com';
        await sendEmail({
          email: boardEmail,
          subject: 'New Institute Application Awaiting Board Review - Semi Phase 3',
          message: `Dear Academic Board,\n\nA new institute application has completed the fee payment and is now ready for review:\nInstitute Name: ${institute.orgName}\nHOD Name: ${institute.hodName}\nRequested Seats: ${institute.seatsRequested}\n\nPlease log in to review the details and documents.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h2 style="color: #0146d8; text-align: center;">New Application for Review</h2>
              <p>Dear Board Members,</p>
              <p>A new institute has completed the application fee payment and is now ready for your review and evaluation.</p>
              
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0146d8;">
                <h3 style="margin-top: 0; color: #333;">Institute Application Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0; color: #666; font-weight: bold; width: 45%;">Healthcare Organization:</td>
                    <td style="padding: 5px 0; color: #333;">${institute.orgName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; color: #666; font-weight: bold;">Requested EM Seats:</td>
                    <td style="padding: 5px 0; color: #333;">${institute.seatsRequested}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; color: #666; font-weight: bold;">Proposed Start Date:</td>
                    <td style="padding: 5px 0; color: #333;">${new Date(institute.commencementDate).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; color: #666; font-weight: bold;">HOD Name:</td>
                    <td style="padding: 5px 0; color: #333;">${institute.hodName}</td>
                  </tr>
                </table>
              </div>
              
              <p>Please log in to the admin board portal to check all details, evaluate their uploaded files, and perform actions (Approve/Reject or schedule inspections).</p>
              
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #999999; text-align: center;">This is an system-generated administrative notification.</p>
            </div>
          `
        });
      } catch (emailErr: any) {
        console.error('Board notification email sending failed:', emailErr.message);
      }
    }

    return sendSuccess({
      req,
      res,
      message: 'Payment completed successfully. Application is now ready for board review.',
      data: {
        paymentStatus: 'Completed',
        paymentId: paymentIdToVerify,
        receiptNumber,
        institute
      },
    });
  } catch (error: any) {
    console.error('❌ Payment verification error:', error);
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const reviewApplication = async (req: Request, res: Response) => {
  try {
    const { instituteId } = req.params;
    const { status, remarks, approvedSeats } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return sendError({ req, res, statusCode: 400, message: 'Status must be Approved or Rejected' });
    }

    const institute = await Institute.findById(instituteId);
    if (!institute) {
      return sendError({ req, res, statusCode: 404, message: 'Institute not found' });
    }

    // Enforce Module 1 Rule: Inspection fee payment is mandatory before board review
    if (institute.paymentStatus !== 'Completed') {
      return sendError({
        req,
        res,
        statusCode: 400,
        message: 'Cannot review application. Inspection fee payment is pending.'
      });
    }

    institute.status = status;
    institute.remarks = remarks || '';
    if (approvedSeats !== undefined && !isNaN(Number(approvedSeats))) {
      institute.approvedSeats = Number(approvedSeats);
    }
    await institute.save();

    // Fetch the user related to the institute
    const user = await User.findById(institute.user);
    if (user) {
      // Send Status Update Email to the institute
      try {
        const isApproved = status === 'Approved';
        await sendEmail({
          email: user.email,
          subject: `Institute Application ${status} - Semi Phase 3`,
          message: `Hello ${user.name},\n\nWe would like to inform you that your application for onboarding the institute "${institute.orgName}" has been ${status} by the Academic Board.\n\nBoard Remarks:\n${remarks || 'No remarks provided.'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h2 style="color: ${isApproved ? '#2ecc71' : '#e74c3c'}; text-align: center;">Application ${status}</h2>
              <p>Hello <strong>${user.name}</strong>,</p>
              <p>We would like to inform you that your application for onboarding the institute <strong>${institute.orgName}</strong> has been <strong>${status}</strong> by the Academic Board.</p>
              
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${isApproved ? '#2ecc71' : '#e74c3c'};">
                <h3 style="margin-top: 0; color: #333;">Board Review Feedback</h3>
                <p style="font-style: italic; color: #555;">"${remarks || 'No specific remarks provided.'}"</p>
              </div>
              
              ${isApproved 
                ? `<p>Your institute profile is now fully active in the system. You can log in to your portal to start onboarding and access administrative configurations.</p>`
                : `<p>Please address the board feedback above. You can update your documentation, correct structural issues, and resubmit when prepared.</p>`
              }
              
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #999999; text-align: center;">This is an automated notification from the Academic Board.</p>
            </div>
          `
        });
      } catch (emailErr: any) {
        console.error('Review status email sending failed:', emailErr.message);
      }
    }

    return sendSuccess({
      req,
      res,
      message: `Institute application ${status.toLowerCase()} successfully`,
      data: institute,
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const getMyApplication = async (req: Request, res: Response) => {
  try {
    const institute = await Institute.findOne({ user: req.user._id });
    return sendSuccess({
      req,
      res,
      message: 'My institute application retrieved successfully',
      data: institute,
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const listApplications = async (req: Request, res: Response) => {
  try {
    const applications = await Institute.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    return sendSuccess({
      req,
      res,
      message: 'All institute applications retrieved successfully',
      data: applications,
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const toggleInspection = async (req: Request, res: Response) => {
  try {
    const { instituteId } = req.params;
    const { inspectionTriggered } = req.body;

    const institute = await Institute.findById(instituteId);
    if (!institute) {
      return sendError({ req, res, statusCode: 404, message: 'Institute not found' });
    }

    institute.inspectionTriggered = !!inspectionTriggered;
    await institute.save();

    return sendSuccess({
      req,
      res,
      message: 'Site inspection status updated successfully',
      data: institute,
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const institute = await Institute.findOne({ user: req.user._id });
    if (!institute) {
      return sendSuccess({
        req,
        res,
        message: 'No application found yet',
        data: {
          paymentStatus: 'Pending',
          razorpayOrderId: null,
          razorpayPaymentId: null,
          paymentCompletedAt: null,
        },
      });
    }

    return sendSuccess({
      req,
      res,
      message: 'Payment status retrieved successfully',
      data: {
        paymentStatus: institute.paymentStatus,
        razorpayOrderId: institute.razorpayOrderId,
        razorpayPaymentId: institute.razorpayPaymentId,
        paymentCompletedAt: institute.paymentCompletedAt,
      },
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

export const checkPaymentAndUpdate = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    let institute = await Institute.findOne({ razorpayOrderId: orderId });

    // Fallback: if not found by orderId, try by authenticated user
    if (!institute) {
      institute = await Institute.findOne({ user: req.user._id });
    }

    if (!institute) {
      return sendSuccess({
        req,
        res,
        message: 'No application found yet',
        data: {
          paymentStatus: 'Pending',
          razorpayPaymentId: null,
        },
      });
    }

    if (institute.paymentStatus === 'Completed') {
      return sendSuccess({
        req,
        res,
        message: 'Payment already completed',
        data: {
          paymentStatus: institute.paymentStatus,
          razorpayPaymentId: institute.razorpayPaymentId,
        },
      });
    }

    if (institute.razorpayPaymentId) {
      try {
        const payment = await razorpayInstance.payments.fetch(institute.razorpayPaymentId);
        if (payment.status === 'captured') {
          institute.paymentStatus = 'Completed';
          institute.paymentCompletedAt = new Date();
          institute.paymentAmount = payment.amount / 100;
          await institute.save();

          try {
            await sendPaymentConfirmationEmail(institute, req.user);
          } catch (emailErr: any) {
            console.error('Payment confirmation email failed:', emailErr.message);
          }

          return sendSuccess({
            req,
            res,
            message: 'Payment verified and completed',
            data: {
              paymentStatus: 'Completed',
              razorpayPaymentId: institute.razorpayPaymentId,
            },
          });
        }
      } catch (error) {
        console.error('Error fetching payment from Razorpay:', error);
      }
    }

    try {
      const payments = await razorpayInstance.api.get({
        url: '/payments',
        data: { order_id: orderId },
      });
      const payment = payments?.items?.[0];
      if (payment && payment.status === 'captured') {
        institute.razorpayPaymentId = payment.id;
        institute.paymentStatus = 'Completed';
        institute.paymentCompletedAt = new Date();
        institute.paymentAmount = payment.amount / 100;
        await institute.save();

        try {
          await sendPaymentConfirmationEmail(institute, req.user);
        } catch (emailErr: any) {
          console.error('Payment confirmation email failed:', emailErr.message);
        }

        return sendSuccess({
          req,
          res,
          message: 'Payment verified and completed',
          data: {
            paymentStatus: 'Completed',
            razorpayPaymentId: institute.razorpayPaymentId,
          },
        });
      }
    } catch (error) {
      console.error('Error fetching payment by order from Razorpay:', error);
    }

    return sendSuccess({
      req,
      res,
      message: 'Payment pending verification',
      data: {
        paymentStatus: institute.paymentStatus,
      },
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

async function sendPaymentConfirmationEmail(institute: any, user: any) {
  await sendEmail({
    email: user.email,
    subject: 'Payment Receipt Confirmation - Semi Phase 3',
    message: `Hello ${user.name},\n\nWe have successfully received your payment.\nPayment ID: ${institute.razorpayPaymentId}\nOrder ID: ${institute.razorpayOrderId}\nAmount: INR 5,000.00\nStatus: Completed\n\nYour application has been moved to the Academic Board for review.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #2ecc71; text-align: center;">Payment Receipt Confirmation</h2>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>We are pleased to confirm that we have successfully processed your inspection fee payment. Your application is now ready for the Academic Board review.</p>

        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2ecc71;">
          <h3 style="margin-top: 0; color: #333;">Receipt Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 0; color: #666; font-weight: bold; width: 45%;">Payment ID:</td>
              <td style="padding: 5px 0; color: #333; font-family: monospace;">${institute.razorpayPaymentId}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #666; font-weight: bold;">Order ID:</td>
              <td style="padding: 5px 0; color: #333; font-family: monospace;">${institute.razorpayOrderId}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #666; font-weight: bold;">Amount Paid:</td>
              <td style="padding: 5px 0; color: #333;">INR 5,000.00</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #666; font-weight: bold;">Status:</td>
              <td style="padding: 5px 0; color: #2ecc71; font-weight: bold;">Paid / Completed</td>
            </tr>
          </table>
        </div>

        <p>The Academic Board will review your application details, uploaded documents, and schedule an inspection if required. We will keep you notified of any updates.</p>

        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999999; text-align: center;">This is an automated receipt email. Please keep this for your records.</p>
      </div>
    `
  });
}

export const debugPaymentStatus = async (req: Request, res: Response) => {
  try {
    const institute = await Institute.findOne({ user: req.user._id });
    return sendSuccess({
      req,
      res,
      message: 'Debug payment status',
      data: {
        institute: {
          paymentStatus: institute?.paymentStatus || 'Not found',
          razorpayPaymentId: institute?.razorpayPaymentId || 'Not set',
          razorpayOrderId: institute?.razorpayOrderId || 'Not set',
          razorpaySignature: institute?.razorpaySignature ? 'Set' : 'Not set'
        }
      }
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};
            