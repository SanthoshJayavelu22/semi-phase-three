// backend/src/validators/authValidator.ts
import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must include uppercase, lowercase, number, and special character'
    ),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const instituteApplicationSchema = z.object({
  orgName: z.string().min(2, 'Organization name is required'),
  constitutionType: z.string().min(1, 'Constitution type is required'),
  instituteAddress: z.string().min(5, 'Institute address is required'),
  registeredOfficeAddress: z.string().min(5, 'Registered office address is required'),
  phoneNumber: z.string().min(10, 'Valid phone number is required'),
  emailAddress: z.string().email('Valid email address is required'),
  commencementDate: z.string().or(z.date()),
  seatsRequested: z.number().min(1, 'Seats requested must be at least 1'),
  headName: z.string().min(2, 'Head of institution name is required'),
  headDesignation: z.string().min(2, 'Head designation is required'),
  hodName: z.string().min(2, 'HOD name is required'),
  bedCount: z.number().min(1, 'Bed count must be at least 1'),
  physicianExperience: z.number().min(0),
  emFacultyCount: z.number().min(0),
});
