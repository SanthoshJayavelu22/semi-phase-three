import { Request, Response } from 'express';
import { z } from 'zod';
import { Student } from '../models/studentModel';
import { Course } from '../models/courseModel';
import { Institute } from '../models/instituteModel';
import { Result } from '../models/resultModel';
import { sendSuccess, sendError } from '../utils/responseFormatter';

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const updateMarksSchema = z.object({
  semesterNumber: z.coerce.number().min(1, 'Semester number is required'),
  subjects: z
    .array(
      z.object({
        subjectCode: z.string().min(1, 'Subject code is required'),
        subjectName: z.string().min(1, 'Subject name is required'),
        marksObtained: z.union([z.coerce.number(), z.null()]).optional(),
        isAbsent: z.boolean().default(false),
        totalMarks: z.coerce.number().default(100),
      })
    )
    .min(1, 'At least one subject is required'),
});

const bulkUpdateMarksSchema = z.object({
  semesterNumber: z.coerce.number().min(1),
  students: z
    .array(
      z.object({
        studentId: z.string().min(1),
        subjects: z
          .array(
            z.object({
              subjectCode: z.string().min(1),
              subjectName: z.string().min(1),
              marksObtained: z.union([z.coerce.number(), z.null()]).optional(),
              isAbsent: z.boolean().default(false),
              totalMarks: z.coerce.number().default(100),
            })
          )
          .min(1),
      })
    )
    .min(1),
});

// ─── Helper Functions ─────────────────────────────────────────────────────────

const calculateGrade = (marks: number | null, totalMarks: number = 100): string => {
  if (marks === null) return 'ABSENT';
  const percentage = (marks / totalMarks) * 100;
  if (percentage >= 90) return 'O';
  if (percentage >= 80) return 'A+';
  if (percentage >= 70) return 'A';
  if (percentage >= 60) return 'B+';
  if (percentage >= 50) return 'B';
  if (percentage >= 40) return 'C';
  if (percentage >= 35) return 'D';
  return 'F';
};

const getGradePoints = (marks: number | null, totalMarks: number = 100): number => {
  if (marks === null) return 0;
  const percentage = (marks / totalMarks) * 100;
  if (percentage >= 90) return 10;
  if (percentage >= 80) return 9;
  if (percentage >= 70) return 8;
  if (percentage >= 60) return 7;
  if (percentage >= 50) return 6;
  if (percentage >= 40) return 5;
  if (percentage >= 35) return 4;
  return 0;
};

const getInstituteId = async (userId: string) => {
  const institute = await Institute.findOne({ user: userId });
  return institute?._id || null;
};

const buildDefaultMarks = (courseSubjects: string[]) => {
  return courseSubjects.map((sub) => ({
    subjectCode: sub.substring(0, 6).toUpperCase(),
    subjectName: sub,
    marksObtained: null,
    totalMarks: 100,
    isAbsent: false,
    grade: '',
  }));
};

const getSubjectsForCourse = async (courseId: any) => {
  try {
    const course = await Course.findById(courseId);
    return course?.subjects?.length ? course.subjects : [];
  } catch {
    return [];
  }
};

// ─── Get All Students with Marks ─────────────────────────────────────────────

export const getStudentsWithMarks = async (req: Request, res: Response) => {
  try {
    const { courseId, batchId, instituteId, search, semesterNumber } = req.query;
    const query: any = {};

    // Institute access control
    if (req.user.role === 'institute') {
      const instituteIdForUser = await getInstituteId(req.user._id);
      if (!instituteIdForUser) {
        return sendError({ req, res, statusCode: 403, message: 'Access Denied: Your institute is not approved.' });
      }
      query.institute = instituteIdForUser;
    } else if (instituteId) {
      query.institute = instituteId;
    }

    if (courseId) query.course = courseId;
    if (batchId) query.batch = batchId;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { enrollmentId: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await Student.find(query)
      .populate('course', 'name subjects')
      .populate('batch', 'year name')
      .populate('institute', 'orgName')
      .sort({ createdAt: -1 });

    const formattedStudents = await Promise.all(
      students.map(async (student) => {
        const semNum = semesterNumber ? parseInt(semesterNumber as string, 10) : 1;

        const semesterRecord = student.semesters.find((s) => s.semesterNumber === semNum);

        if (semesterRecord) {
          return {
            id: student._id,
            _id: student._id,
            enrollmentId: student.enrollmentId,
            fullName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            contactNumber: student.contactNumber,
            course: student.course,
            batch: student.batch,
            institute: student.institute,
            semesterNumber: semNum,
            attendancePercentage: semesterRecord.attendancePercentage || 0,
            thesisApproved: semesterRecord.thesisApproved || false,
            eligibilityStatus: semesterRecord.eligibilityStatus || 'Pending',
            marks: semesterRecord.marks || [],
            documents: student.documents || {},
            remittedToAcademy: student.remittedToAcademy || false,
          };
        }

        // No semester record yet - seed default subjects from the course
        const courseSubjects = await getSubjectsForCourse(student.course);

        return {
          id: student._id,
          _id: student._id,
          enrollmentId: student.enrollmentId,
          fullName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          contactNumber: student.contactNumber,
          course: student.course,
          batch: student.batch,
          institute: student.institute,
          semesterNumber: semNum,
          attendancePercentage: 0,
          thesisApproved: false,
          eligibilityStatus: 'Pending',
          marks: buildDefaultMarks(courseSubjects),
          documents: student.documents || {},
          remittedToAcademy: student.remittedToAcademy || false,
        };
      })
    );

    return sendSuccess({
      req,
      res,
      message: 'Students with marks retrieved successfully',
      data: formattedStudents,
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ─── Get Single Student with Marks ──────────────────────────────────────────

export const getStudentMarks = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { semesterNumber } = req.query;

    const query: any = { _id: studentId };

    if (req.user.role === 'institute') {
      const instituteIdForUser = await getInstituteId(req.user._id);
      if (!instituteIdForUser) {
        return sendError({ req, res, statusCode: 403, message: 'Access Denied: Your institute is not approved.' });
      }
      query.institute = instituteIdForUser;
    }

    const student = await Student.findOne(query)
      .populate('course', 'name subjects')
      .populate('batch', 'year name');

    if (!student) {
      return sendError({ req, res, statusCode: 404, message: 'Student not found' });
    }

    const semNum = semesterNumber ? parseInt(semesterNumber as string, 10) : 1;
    const semesterRecord = student.semesters.find((s) => s.semesterNumber === semNum);

    let marks = semesterRecord?.marks || [];
    if (!semesterRecord) {
      const courseSubjects = await getSubjectsForCourse(student.course);
      marks = buildDefaultMarks(courseSubjects);
    }

    return sendSuccess({
      req,
      res,
      message: 'Student marks retrieved successfully',
      data: {
        id: student._id,
        _id: student._id,
        enrollmentId: student.enrollmentId,
        fullName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        contactNumber: student.contactNumber,
        course: student.course,
        batch: student.batch,
        institute: student.institute,
        semesterNumber: semNum,
        attendancePercentage: semesterRecord?.attendancePercentage || 0,
        thesisApproved: semesterRecord?.thesisApproved || false,
        eligibilityStatus: semesterRecord?.eligibilityStatus || 'Pending',
        marks,
        documents: student.documents || {},
        remittedToAcademy: student.remittedToAcademy || false,
      },
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ─── Update Student Marks ────────────────────────────────────────────────────

export const updateStudentMarks = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const validatedData = updateMarksSchema.parse(req.body);

    const query: any = { _id: studentId };

    if (req.user.role === 'institute') {
      const instituteIdForUser = await getInstituteId(req.user._id);
      if (!instituteIdForUser) {
        return sendError({ req, res, statusCode: 403, message: 'Access Denied: Your institute is not approved.' });
      }
      query.institute = instituteIdForUser;
    }

    const student = await Student.findOne(query);
    if (!student) {
      return sendError({ req, res, statusCode: 404, message: 'Student not found' });
    }

    const semNum = validatedData.semesterNumber;
    let semesterIndex = student.semesters.findIndex((s) => s.semesterNumber === semNum);

    if (semesterIndex === -1) {
      student.semesters.push({
        semesterNumber: semNum,
        attendancePercentage: 0,
        thesisApproved: false,
        eligibilityStatus: 'Pending',
        marks: [],
      });
      semesterIndex = student.semesters.length - 1;
    }

    const semester = student.semesters[semesterIndex];
    if (!semester.marks) {
      semester.marks = [];
    }

    for (const subject of validatedData.subjects) {
      const marksData = {
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        marksObtained: subject.isAbsent ? null : subject.marksObtained ?? null,
        totalMarks: subject.totalMarks || 100,
        isAbsent: subject.isAbsent || false,
        grade: subject.isAbsent ? 'ABSENT' : calculateGrade(subject.marksObtained ?? null, subject.totalMarks || 100),
        updatedBy: req.user._id,
        updatedAt: new Date(),
      };

      const existingIndex = semester.marks.findIndex((m) => m.subjectCode === subject.subjectCode);
      if (existingIndex !== -1) {
        semester.marks[existingIndex] = marksData;
      } else {
        semester.marks.push(marksData);
      }
    }

    // Mark semesters array as modified so Mongoose persists nested updates
    student.markModified('semesters');
    await student.save({ validateModifiedOnly: true });

    return sendSuccess({
      req,
      res,
      message: 'Student marks updated successfully',
      data: {
        id: student._id,
        _id: student._id,
        enrollmentId: student.enrollmentId,
        fullName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        semesterNumber: semNum,
        marks: semester.marks,
        attendancePercentage: semester.attendancePercentage || 0,
        thesisApproved: semester.thesisApproved || false,
        eligibilityStatus: semester.eligibilityStatus || 'Pending',
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError({ req, res, statusCode: 400, message: 'Validation failed', errors: error.issues });
    }
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ─── Bulk Update Marks ──────────────────────────────────────────────────────

export const bulkUpdateMarks = async (req: Request, res: Response) => {
  try {
    const validatedData = bulkUpdateMarksSchema.parse(req.body);
    const results: any[] = [];
    const errors: any[] = [];

    for (const studentData of validatedData.students) {
      try {
        const student = await Student.findById(studentData.studentId);
        if (!student) {
          errors.push({ studentId: studentData.studentId, error: 'Student not found' });
          continue;
        }

        const semNum = validatedData.semesterNumber;
        let semesterIndex = student.semesters.findIndex((s) => s.semesterNumber === semNum);

        if (semesterIndex === -1) {
          student.semesters.push({
            semesterNumber: semNum,
            attendancePercentage: 0,
            thesisApproved: false,
            eligibilityStatus: 'Pending',
            marks: [],
          });
          semesterIndex = student.semesters.length - 1;
        }

        const semester = student.semesters[semesterIndex];
        if (!semester.marks) {
          semester.marks = [];
        }

        for (const subject of studentData.subjects) {
          const marksData = {
            subjectCode: subject.subjectCode,
            subjectName: subject.subjectName,
            marksObtained: subject.isAbsent ? null : subject.marksObtained ?? null,
            totalMarks: subject.totalMarks || 100,
            isAbsent: subject.isAbsent || false,
            grade: subject.isAbsent ? 'ABSENT' : calculateGrade(subject.marksObtained ?? null, subject.totalMarks || 100),
            updatedBy: req.user._id,
            updatedAt: new Date(),
          };

          const existingIndex = semester.marks.findIndex((m) => m.subjectCode === subject.subjectCode);
          if (existingIndex !== -1) {
            semester.marks[existingIndex] = marksData;
          } else {
            semester.marks.push(marksData);
          }
        }

        // Mark semesters array as modified so Mongoose persists nested updates
        student.markModified('semesters');
        await student.save({ validateModifiedOnly: true });
        results.push({
          studentId: studentData.studentId,
          name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          status: 'success',
        });
      } catch (err: any) {
        errors.push({ studentId: studentData.studentId, error: err.message });
      }
    }

    return sendSuccess({
      req,
      res,
      message: `Updated ${results.length} students, ${errors.length} failed`,
      data: { results, errors },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError({ req, res, statusCode: 400, message: 'Validation failed', errors: error.issues });
    }
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ─── Get Course Subjects ─────────────────────────────────────────────────────

export const getCourseSubjects = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return sendError({ req, res, statusCode: 404, message: 'Course not found' });
    }

    const subjects = course.subjects || [];
    const subjectList = subjects.map((name: string, index: number) => ({
      code: `${name.substring(0, 6).toUpperCase()}${index + 1}`,
      name,
    }));

    return sendSuccess({
      req,
      res,
      message: 'Course subjects retrieved successfully',
      data: subjectList,
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ─── Result Generation from Marks ────────────────────────────────────────────

const generateResultsFromMarksSchema = z.object({
  semesterNumber: z.coerce.number().min(1),
  batchId: z.string().min(1),
  courseId: z.string().min(1),
  academicYear: z.string().min(1),
  examDate: z.string().optional(),
  publishDate: z.string().optional(),
  publishTime: z.string().optional(),
  selectedStudentIds: z.array(z.string()).optional(),
});

export const generateResultsFromMarks = async (req: Request, res: Response) => {
  try {
    const validatedData = generateResultsFromMarksSchema.parse(req.body);
    const userId = req.user._id;

    // Find all students for this batch/course with marks
    const query: any = {
      batch: validatedData.batchId,
      course: validatedData.courseId,
    };

    if (validatedData.selectedStudentIds && validatedData.selectedStudentIds.length > 0) {
      query._id = { $in: validatedData.selectedStudentIds };
    }

    const students = await Student.find(query)
      .populate('course', 'name subjects')
      .populate('batch', 'year name');

    if (students.length === 0) {
      return sendError({ req, res, statusCode: 404, message: 'No students found for this batch and course.' });
    }

    const results: any[] = [];
    const errors: any[] = [];

    for (const student of students) {
      try {
        // Find the semester record
        const semesterRecord = student.semesters.find(
          (s: any) => s.semesterNumber === validatedData.semesterNumber
        );

        if (!semesterRecord || !semesterRecord.marks || semesterRecord.marks.length === 0) {
          errors.push({
            studentId: student._id,
            name: `${student.firstName} ${student.lastName}`,
            reason: 'No marks found for this semester',
          });
          continue;
        }

        // Check if all subjects have marks or are marked absent
        const allMarked = semesterRecord.marks.every(
          (m: any) => m.isAbsent === true || m.marksObtained !== null
        );

        if (!allMarked) {
          errors.push({
            studentId: student._id,
            name: `${student.firstName} ${student.lastName}`,
            reason: 'Some subjects are not marked (missing marks)',
          });
          continue;
        }

        // Build result subjects
        const subjects = semesterRecord.marks.map((m: any) => {
          const marksObtained = m.isAbsent ? 0 : (m.marksObtained || 0);
          const totalMarks = m.totalMarks || 100;
          const grade = m.isAbsent ? 'ABSENT' : calculateGrade(marksObtained, totalMarks);

          return {
            subjectCode: m.subjectCode,
            subjectName: m.subjectName,
            internalMarks: Math.floor(marksObtained * 0.4),
            externalMarks: Math.ceil(marksObtained * 0.6),
            totalMarks: marksObtained,
            grade,
            credits: 3,
            gradePoints: getGradePoints(marksObtained),
            isRevaluationApplied: false,
            isRevaluationCompleted: false,
          };
        });

        // Calculate overall metrics
        const totalMarks = subjects.reduce((sum: number, s: any) => sum + (s.totalMarks || 0), 0);
        const maxMarks = subjects.length * 100;
        const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
        const totalCredits = subjects.reduce((sum: number, s: any) => sum + (s.credits || 0), 0);

        const gradePoints = subjects.map((s: any) => s.gradePoints || 0);
        const sgpa = subjects.length > 0 ? gradePoints.reduce((a: number, b: number) => a + b, 0) / subjects.length : 0;

        let division = 'Fail';
        let resultStatus = 'FAIL';
        if (percentage >= 60) {
          division = 'First';
          resultStatus = 'PASS';
        } else if (percentage >= 50) {
          division = 'Second';
          resultStatus = 'PASS';
        } else if (percentage >= 40) {
          division = 'Third';
          resultStatus = 'PASS';
        } else if (percentage >= 35) {
          division = 'Pass';
          resultStatus = 'PASS';
        }

        // Check if result already exists
        const existingResult = await Result.findOne({
          student: student._id,
          academicYear: validatedData.academicYear,
          semester: validatedData.semesterNumber,
        });

        if (existingResult) {
          const previousSubjects = existingResult.subjects;
          existingResult.subjects = subjects as any;
          existingResult.totalMarks = totalMarks;
          existingResult.totalCredits = totalCredits;
          existingResult.percentage = parseFloat(percentage.toFixed(2));
          existingResult.cgpa = parseFloat(sgpa.toFixed(2));
          existingResult.sgpa = parseFloat(sgpa.toFixed(2));
          existingResult.division = division as any;
          existingResult.resultStatus = resultStatus as any;
          existingResult.auditHistory.push({
            action: 'UPDATED',
            previousData: { subjects: previousSubjects },
            newData: { subjects },
            performedBy: userId,
            timestamp: new Date(),
          });
          await existingResult.save();
          results.push(existingResult);
        } else {
          // Create new result
          const newResult = await Result.create({
            student: student._id,
            academicYear: validatedData.academicYear,
            semester: validatedData.semesterNumber,
            subjects: subjects as any,
            totalMarks,
            totalCredits,
            percentage: parseFloat(percentage.toFixed(2)),
            cgpa: parseFloat(sgpa.toFixed(2)),
            sgpa: parseFloat(sgpa.toFixed(2)),
            division: division as any,
            resultStatus: resultStatus as any,
            isPublished: false,
            auditHistory: [
              {
                action: 'CREATED',
                performedBy: userId,
                timestamp: new Date(),
              },
            ],
          });
          results.push(newResult);
        }
      } catch (err: any) {
        errors.push({
          studentId: student._id,
          name: `${student.firstName} ${student.lastName}`,
          reason: err.message,
        });
      }
    }

    return sendSuccess({
      req,
      res,
      message: `Generated ${results.length} results, ${errors.length} errors`,
      data: {
        totalStudents: students.length,
        generated: results.length,
        errors: errors.length,
        results,
        errorDetails: errors,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError({ req, res, statusCode: 400, message: 'Validation failed', errors: error.issues });
    }
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ─── Publish Results ──────────────────────────────────────────────────────────

const publishResultsSchema = z.object({
  semesterNumber: z.coerce.number().min(1),
  batchId: z.string().min(1),
  courseId: z.string().min(1),
  academicYear: z.string().min(1),
  publishDate: z.string().transform((val) => new Date(val)),
  publishTime: z.string().min(1),
  selectedStudentIds: z.array(z.string()).optional(),
  sendNotifications: z.boolean().default(false),
});

export const publishResults = async (req: Request, res: Response) => {
  try {
    const validatedData = publishResultsSchema.parse(req.body);
    const userId = req.user._id;

    // Resolve student IDs for this batch/course (Result model stores student ref only)
    const studentQuery: any = {
      batch: validatedData.batchId,
      course: validatedData.courseId,
    };

    if (validatedData.selectedStudentIds && validatedData.selectedStudentIds.length > 0) {
      studentQuery._id = { $in: validatedData.selectedStudentIds };
    }

    const students = await Student.find(studentQuery, '_id firstName lastName enrollmentId');
    if (students.length === 0) {
      return sendError({ req, res, statusCode: 404, message: 'No students found for this batch and course.' });
    }

    const studentIds = students.map((s) => s._id);

    const results = await Result.find({
      student: { $in: studentIds },
      semester: validatedData.semesterNumber,
      academicYear: validatedData.academicYear,
    }).populate('student');

    if (results.length === 0) {
      return sendError({ req, res, statusCode: 404, message: 'No results found to publish.' });
    }

    let publishedCount = 0;
    let skippedCount = 0;
    const publishedResults: any[] = [];

    for (const result of results) {
      if (result.isPublished) {
        skippedCount++;
        continue;
      }

      result.isPublished = true;
      result.publishedDate = validatedData.publishDate;

      const deadline = new Date(validatedData.publishDate);
      deadline.setDate(deadline.getDate() + 10);
      result.revaluationDeadline = deadline;
      result.isRevaluationActive = true;

      result.auditHistory.push({
        action: 'PUBLISHED',
        performedBy: userId,
        timestamp: new Date(),
      });

      await result.save();
      publishedCount++;
      publishedResults.push(result);
    }

    // Generate certificates for passed students
    if (validatedData.sendNotifications) {
      for (const result of publishedResults) {
        if (result.resultStatus === 'PASS') {
          // Generate provisional certificate
          // This would call the certificate generation service
          console.log(`[MOCK] Generating provisional certificate for student: ${result.student}`);
        }
      }
    }

    return sendSuccess({
      req,
      res,
      message: `Published ${publishedCount} results, ${skippedCount} already published`,
      data: {
        publishedCount,
        skippedCount,
        totalResults: results.length,
        publishedResults,
        publishDate: validatedData.publishDate,
        publishTime: validatedData.publishTime,
        notificationsSent: validatedData.sendNotifications,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError({ req, res, statusCode: 400, message: 'Validation failed', errors: error.issues });
    }
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};

// ─── Get Publication Status ──────────────────────────────────────────────────

export const getPublicationStatus = async (req: Request, res: Response) => {
  try {
    const { batchId, courseId, semesterNumber } = req.query;

    const query: any = {};
    if (batchId) query.batch = batchId;
    if (courseId) query.course = courseId;

    const semNum = semesterNumber ? parseInt(semesterNumber as string, 10) : 1;

    // Get all students with marks status
    const students = await Student.find(query)
      .populate('course', 'name')
      .populate('batch', 'year name');

    const studentIds = students.map((s) => s._id);

    // Which students already have a Result for this semester
    const existingResults = await Result.find({
      student: { $in: studentIds },
      semester: semNum,
    }).select('student isPublished');

    const resultMap = new Map();
    for (const r of existingResults) {
      resultMap.set(String(r.student), r);
    }

    const statusData = students.map((student) => {
      const semesterRecord = student.semesters.find(
        (s: any) => s.semesterNumber === semNum
      );

      const hasMarks = semesterRecord?.marks && semesterRecord.marks.length > 0;
      const allMarked = semesterRecord?.marks
        ? semesterRecord.marks.every(
            (m: any) => m.isAbsent === true || m.marksObtained !== null
          )
        : false;

      const resultRecord = resultMap.get(String(student._id));
      const resultExists = !!resultRecord;
      const isPublished = resultExists && resultRecord.isPublished;

      return {
        studentId: student._id,
        name: `${student.firstName} ${student.lastName}`,
        enrollmentId: student.enrollmentId,
        hasMarks: hasMarks || false,
        allMarked: hasMarks ? allMarked : false,
        resultExists,
        isPublished,
        status: isPublished
          ? 'Published'
          : hasMarks && allMarked
            ? 'Ready'
            : hasMarks
              ? 'Partial'
              : 'No Marks',
        student,
      };
    });

    const total = statusData.length;
    const ready = statusData.filter((s) => s.status === 'Ready').length;
    const partial = statusData.filter((s) => s.status === 'Partial').length;
    const noMarks = statusData.filter((s) => s.status === 'No Marks').length;
    const published = statusData.filter((s) => s.status === 'Published').length;

    return sendSuccess({
      req,
      res,
      message: 'Publication status retrieved successfully',
      data: {
        summary: { total, ready, partial, noMarks, published },
        students: statusData,
      },
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};
