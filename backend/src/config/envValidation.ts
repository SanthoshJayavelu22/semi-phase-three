// backend/src/config/envValidation.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().or(z.number()).default(5003),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters').optional(),
  // Business fee constants — optional, defaults are applied in code
  INSPECTION_FEE_INR: z.coerce.number().positive().optional(),
  STUDENT_REMITTANCE_FEE_INR: z.coerce.number().positive().optional(),
  REVALUATION_FEE_PER_SUBJECT_INR: z.coerce.number().positive().optional(),
  ATTENDANCE_MIN_PERCENTAGE: z.coerce.number().min(1).max(100).optional(),
});

export const validateEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Environment variable validation warnings/failed:');
    result.error.issues.forEach((issue) => {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  } else {
    console.log('✅ Environment configuration validated successfully.');
  }
};
