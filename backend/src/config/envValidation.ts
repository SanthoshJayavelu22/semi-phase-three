// backend/src/config/envValidation.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().or(z.number()).default(5003),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters'),
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
