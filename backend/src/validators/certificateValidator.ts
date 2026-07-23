import { z } from 'zod';

export const issueCertificateSchema = z.object({
  student: z.string().min(1, 'Student ID is required'),
  type: z.enum(['PROVISIONAL', 'CONSOLIDATED', 'DUPLICATE', 'TRANSFER']),
  academicYear: z.string().min(1, 'Academic year is required'),
  semester: z.coerce.number().int().min(1).max(8).optional(),
  result: z.string().optional(),
  certificatePDF: z.string().optional(),
  expiryDate: z.string().optional(),
});

export const updateCertificateSchema = z.object({
  isVerified: z.boolean().optional(),
  isRevoked: z.boolean().optional(),
  revocationReason: z.string().optional(),
  expiryDate: z.string().optional(),
});
