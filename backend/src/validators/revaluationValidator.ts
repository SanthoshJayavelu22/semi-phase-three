import { z } from 'zod';

export const createRevaluationSchema = z.object({
  student: z.string().min(1, 'Student ID is required'),
  result: z.string().min(1, 'Result ID is required'),
  institute: z.string().min(1, 'Institute ID is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  semester: z.coerce.number().int().min(1, 'Semester must be at least 1').max(8, 'Semester must be at most 8'),
  subjects: z
    .array(
      z.object({
        subjectCode: z.string().min(1, 'Subject code is required'),
        subjectName: z.string().min(1, 'Subject name is required'),
        originalMarks: z.coerce.number().min(0),
        originalGrade: z.string().min(1),
        internalMarks: z.coerce.number().min(0).max(100),
        externalMarks: z.coerce.number().min(0).max(100),
        revaluationReason: z.string().min(1, 'Revaluation reason is required'),
      })
    )
    .min(1, 'At least one subject is required'),
  feePerSubject: z.coerce.number().min(0, 'Fee per subject must be positive'),
  totalFee: z.coerce.number().min(0, 'Total fee must be positive'),
});

export const updateRevaluationStatusSchema = z.object({
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED']),
  comments: z.string().optional(),
  assignedEvaluator: z.string().optional(),
});

export const addRevaluationResultSchema = z.object({
  subjectCode: z.string().min(1, 'Subject code is required'),
  subjectName: z.string().min(1, 'Subject name is required'),
  revisedInternalMarks: z.coerce.number().min(0).max(100).optional(),
  revisedExternalMarks: z.coerce.number().min(0).max(100).optional(),
  revisedTotalMarks: z.coerce.number().min(0).max(100),
  revisedGrade: z.enum(['O', 'A+', 'A', 'B+', 'B', 'C', 'D', 'F', 'ABSENT']),
  evaluatorComments: z.string().optional(),
  isFinal: z.boolean().optional(),
});
