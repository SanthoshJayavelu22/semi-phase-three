import { z } from 'zod';

export const createResultSchema = z.object({
  student: z.string().min(1, 'Student ID is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  semester: z.coerce.number().int().min(1, 'Semester must be at least 1').max(8, 'Semester must be at most 8'),
  subjects: z
    .array(
      z.object({
        subjectCode: z.string().min(1, 'Subject code is required'),
        subjectName: z.string().min(1, 'Subject name is required'),
        internalMarks: z.coerce.number().min(0).max(100).default(0),
        externalMarks: z.coerce.number().min(0).max(100).default(0),
        totalMarks: z.coerce.number().min(0).max(100).optional(),
        grade: z.enum(['O', 'A+', 'A', 'B+', 'B', 'C', 'D', 'F', 'ABSENT']).optional(),
        credits: z.coerce.number().int().min(1, 'Credits must be at least 1').max(6, 'Credits must be at most 6'),
        gradePoints: z.coerce.number().min(0).max(10).optional(),
      })
    )
    .min(1, 'At least one subject is required'),
});

export const updateResultSchema = z.object({
  student: z.string().min(1).optional(),
  academicYear: z.string().min(1).optional(),
  semester: z.coerce.number().int().min(1).max(8).optional(),
  subjects: z
    .array(
      z.object({
        subjectCode: z.string().min(1),
        subjectName: z.string().min(1),
        internalMarks: z.coerce.number().min(0).max(100).optional(),
        externalMarks: z.coerce.number().min(0).max(100).optional(),
        totalMarks: z.coerce.number().min(0).max(100).optional(),
        grade: z.enum(['O', 'A+', 'A', 'B+', 'B', 'C', 'D', 'F', 'ABSENT']).optional(),
        credits: z.coerce.number().int().min(1).max(6).optional(),
        gradePoints: z.coerce.number().min(0).max(10).optional(),
      })
    )
    .optional(),
  isPublished: z.boolean().optional(),
});

export const bulkUploadSchema = z.object({
  results: z
    .array(
      z.object({
        student: z.string().min(1, 'Student ID is required'),
        academicYear: z.string().min(1, 'Academic year is required'),
        semester: z.coerce.number().int().min(1).max(8),
        subjects: z
          .array(
            z.object({
              subjectCode: z.string().min(1),
              subjectName: z.string().min(1),
              internalMarks: z.coerce.number().min(0).max(100).default(0),
              externalMarks: z.coerce.number().min(0).max(100).default(0),
              credits: z.coerce.number().int().min(1).max(6),
            })
          )
          .min(1),
      })
    )
    .min(1, 'At least one result is required'),
});
