import { Request, Response } from 'express';
import { z } from 'zod';
import { Student } from '../models/studentModel';
import { Course } from '../models/courseModel';
import { Institute } from '../models/instituteModel';
import { Result } from '../models/resultModel';
import { sendSuccess, sendError } from '../utils/responseFormatter';
import { emitEvent } from '../config/socket';

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const updateMarksSchema = z.object({
  examinationNumber: z.coerce.number().min(1, 'Examination number is required').max(2),
  subjects: z
    .array(
      z.object({
        subjectCode: z.string().min(1, 'Subject code is required'),
        subjectName: z.string().min(1, 'Subject name is required'),
        marksObtained: z.union([z.coerce.number(), z.null()]).optional(),
        isAbsent: z.boolean().default(false),
        totalMarks: z.coerce.number().default(100),
        status: z.string().optional(),
      })
    )
    .min(1, 'At least one subject is required'),
});

const bulkUpdateMarksSchema = z.object({
  examinationNumber: z.coerce.number().min(1).max(2),
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
              status: z.string().optional(),
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

const formatMarkWithStatus = (m: any) => {
  const markObj = m && typeof m.toObject === 'function' ? m.toObject() : { ...m };
  let status = (markObj.status || '').toUpperCase();
  const isAbsent = markObj.isAbsent === true || markObj.grade === 'ABSENT' || status === 'ABSENT';
  if (!status) {
    if (isAbsent) {
      status = 'ABSENT';
    } else if (markObj.grade === 'F' || markObj.marksObtained === 0) {
      status = 'FAIL';
    } else if (markObj.marksObtained !== null && markObj.marksObtained !== undefined) {
      status = markObj.marksObtained >= 50 ? 'PASS' : 'FAIL';
    } else if (markObj.grade && markObj.grade !== '') {
      status = ['O', 'A+', 'A', 'B+', 'B', 'C', 'D'].includes(markObj.grade) ? 'PASS' : '';
    }
  }
  const subjectCode = markObj.subjectCode || markObj.code || '';
  const subjectName = markObj.subjectName || markObj.name || markObj.subject || '';
  return {
    ...markObj,
    subjectCode,
    subjectName,
    status,
    isAbsent,
  };
};

const getCourseSubjectsList = async (
  courseIdOrDoc: any,
  examinationNumber: number = 1
): Promise<{ code: string; name: string }[]> => {
  try {
    const courseId = courseIdOrDoc?._id || courseIdOrDoc;
    let course =
      courseIdOrDoc && (courseIdOrDoc.examinations || courseIdOrDoc.subjects)
        ? courseIdOrDoc
        : null;

    if (!course && courseId) {
      course = await Course.findById(courseId);
    }
    if (!course) return [];

    const examNum = Number(examinationNumber) || 1;

    // 1. Check course.examinations for this specific examinationNumber
    const exam = (course.examinations || []).find(
      (e: any) => Number(e.examinationNumber) === examNum
    );
    if (exam && exam.subjects && exam.subjects.length > 0) {
      const validSubs = exam.subjects
        .filter((s: any) => s && (s.name || s.subjectName))
        .map((s: any, idx: number) => ({
          code: s.code || s.subjectCode || `SUB${idx + 1}`,
          name: (s.name || s.subjectName || '').trim(),
        }));
      if (validSubs.length > 0) return validSubs;
    }

    // 2. Check if any examination in course.examinations has subjects
    for (const otherExam of course.examinations || []) {
      if (otherExam && otherExam.subjects && otherExam.subjects.length > 0) {
        const validSubs = otherExam.subjects
          .filter((s: any) => s && (s.name || s.subjectName))
          .map((s: any, idx: number) => ({
            code: s.code || s.subjectCode || `SUB${idx + 1}`,
            name: (s.name || s.subjectName || '').trim(),
          }));
        if (validSubs.length > 0) return validSubs;
      }
    }

    // 3. Check course.subjects
    if (course.subjects && course.subjects.length > 0) {
      return course.subjects.map((sub: any, idx: number) => {
        if (typeof sub === 'string') {
          const parts = sub.split(':');
          if (parts.length > 1 && parts[0].trim().length <= 10) {
            return {
              code: parts[0].trim(),
              name: parts.slice(1).join(':').trim(),
            };
          }
          const cleanSub = sub.trim();
          const cleanCode = cleanSub.replace(/[^A-Za-z0-9]/g, '').substring(0, 6).toUpperCase();
          return {
            code: `${cleanCode || 'SUB'}${idx + 1}`,
            name: cleanSub,
          };
        }
        return {
          code: sub.code || sub.subjectCode || `SUB${idx + 1}`,
          name: sub.name || sub.subjectName || `Subject ${idx + 1}`,
        };
      });
    }

    return [];
  } catch (err) {
    console.error('Error in getCourseSubjectsList:', err);
    return [];
  }
};

const buildDefaultMarks = (courseSubjectsList: { code: string; name: string }[]) => {
  return (courseSubjectsList || []).map((sub, idx) => ({
    subjectCode: sub.code || `SUB${idx + 1}`,
    subjectName: sub.name || `Subject ${idx + 1}`,
    marksObtained: null,
    totalMarks: 100,
    isAbsent: false,
    grade: '',
    status: '',
  }));
};

const enrichMarksWithCourseSubjects = (
  existingMarks: any[],
  courseSubjects: { code: string; name: string }[]
) => {
  if (!existingMarks || existingMarks.length === 0) {
    return buildDefaultMarks(courseSubjects);
  }

  return existingMarks.map((m: any, idx: number) => {
    const formatted = formatMarkWithStatus(m);
    let subjectCode = formatted.subjectCode;
    let subjectName = formatted.subjectName;

    // If subjectName or subjectCode is missing, look it up from courseSubjects
    if (!subjectName || !subjectCode) {
      const match =
        courseSubjects.find(
          (cs) =>
            (subjectCode && cs.code.toLowerCase() === subjectCode.toLowerCase()) ||
            (subjectName && cs.name.toLowerCase() === subjectName.toLowerCase())
        ) || courseSubjects[idx];

      if (match) {
        if (!subjectCode) subjectCode = match.code;
        if (!subjectName) subjectName = match.name;
      }
    }

    return {
      ...formatted,
      subjectCode: subjectCode || `SUB${idx + 1}`,
      subjectName: subjectName || `Subject ${idx + 1}`,
    };
  });
};

const resolveMergedMarks = async (
  studentId: any,
  examinationNumber: number,
  existingMarks: any[],
  courseSubjects: { code: string; name: string }[] = []
) => {
  try {
    const resultDoc = await Result.findOne({ student: studentId, examination: examinationNumber });
    let merged = [...(existingMarks || [])];

    if (resultDoc && resultDoc.subjects && resultDoc.subjects.length > 0) {
      resultDoc.subjects.forEach((resSubj: any) => {
        const subCode = resSubj.subjectCode || resSubj.code || '';
        const subName = resSubj.subjectName || resSubj.name || '';
        const idx = merged.findIndex(
          (m: any) =>
            (m.subjectCode && subCode && m.subjectCode.toLowerCase() === subCode.toLowerCase()) ||
            (m.subjectName && subName && m.subjectName.toLowerCase() === subName.toLowerCase())
        );
        const isAbsent = resSubj.grade === 'ABSENT';
        const markVal = resSubj.totalMarks;
        const status = isAbsent
          ? 'ABSENT'
          : resSubj.grade === 'F' || (markVal !== null && markVal !== undefined && markVal < 50)
            ? 'FAIL'
            : 'PASS';

        if (idx !== -1) {
          merged[idx] = {
            ...merged[idx],
            subjectCode: merged[idx].subjectCode || subCode,
            subjectName: merged[idx].subjectName || subName,
            marksObtained: markVal ?? merged[idx].marksObtained,
            grade: resSubj.grade || merged[idx].grade,
            isAbsent,
            status: status || merged[idx].status,
          };
        } else {
          merged.push({
            subjectCode: subCode,
            subjectName: subName,
            marksObtained: markVal,
            totalMarks: 100,
            isAbsent,
            grade: resSubj.grade,
            status,
          });
        }
      });
    }

    return enrichMarksWithCourseSubjects(merged, courseSubjects);
  } catch (err) {
    console.error('Error in resolveMergedMarks:', err);
    return enrichMarksWithCourseSubjects(existingMarks || [], courseSubjects);
  }
};

// ─── Get All Students with Marks ─────────────────────────────────────────────

export const getStudentsWithMarks = async (req: Request, res: Response) => {
  try {
    const { courseId, batchId, instituteId, search, examinationNumber } = req.query;
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
      .populate('course', 'name subjects examinations')
      .populate('batch', 'year name')
      .populate('institute', 'orgName')
      .sort({ createdAt: -1 });

    const formattedStudents = await Promise.all(
      students.map(async (student) => {
        const examNum = examinationNumber ? parseInt(examinationNumber as string, 10) : 1;
        const examinationRecord = student.examinations.find((s) => s.examinationNumber === examNum);
        const courseSubjects = await getCourseSubjectsList(student.course, examNum);

        const baseMarks =
          examinationRecord?.marks && examinationRecord.marks.length > 0
            ? enrichMarksWithCourseSubjects(examinationRecord.marks, courseSubjects)
            : buildDefaultMarks(courseSubjects);

        const mergedMarks = await resolveMergedMarks(student._id, examNum, baseMarks, courseSubjects);

        if (examinationRecord) {
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
            examinationNumber: examNum,
            attendancePercentage: examinationRecord.attendancePercentage || 0,
            thesisApproved: examinationRecord.thesisApproved || false,
            eligibilityStatus: examinationRecord.eligibilityStatus || 'Pending',
            marks: mergedMarks,
            documents: student.documents || {},
            remittedToAcademy: student.remittedToAcademy || false,
          };
        }

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
          examinationNumber: examNum,
          attendancePercentage: 0,
          thesisApproved: false,
          eligibilityStatus: 'Pending',
          marks: mergedMarks,
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
    const { examinationNumber } = req.query;

    const query: any = { _id: studentId };

    if (req.user.role === 'institute') {
      const instituteIdForUser = await getInstituteId(req.user._id);
      if (!instituteIdForUser) {
        return sendError({ req, res, statusCode: 403, message: 'Access Denied: Your institute is not approved.' });
      }
      query.institute = instituteIdForUser;
    }

    const student = await Student.findOne(query)
      .populate('course', 'name subjects examinations')
      .populate('batch', 'year name');

    if (!student) {
      return sendError({ req, res, statusCode: 404, message: 'Student not found' });
    }

    const examNum = examinationNumber ? parseInt(examinationNumber as string, 10) : 1;
    const examinationRecord = student.examinations.find((s) => s.examinationNumber === examNum);
    const courseSubjects = await getCourseSubjectsList(student.course, examNum);

    const baseMarks =
      examinationRecord?.marks && examinationRecord.marks.length > 0
        ? enrichMarksWithCourseSubjects(examinationRecord.marks, courseSubjects)
        : buildDefaultMarks(courseSubjects);

    const marks = await resolveMergedMarks(student._id, examNum, baseMarks, courseSubjects);

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
        examinationNumber: examNum,
        attendancePercentage: examinationRecord?.attendancePercentage || 0,
        thesisApproved: examinationRecord?.thesisApproved || false,
        eligibilityStatus: examinationRecord?.eligibilityStatus || 'Pending',
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

    const examNum = validatedData.examinationNumber;
    const courseSubjects = await getCourseSubjectsList(student.course, examNum);
    let examinationIndex = student.examinations.findIndex((s) => s.examinationNumber === examNum);

    if (examinationIndex === -1) {
      student.examinations.push({
        examinationNumber: examNum,
        attendancePercentage: 0,
        thesisApproved: false,
        eligibilityStatus: 'Pending',
        marks: [],
      });
      examinationIndex = student.examinations.length - 1;
    }

    const examination = student.examinations[examinationIndex];
    if (!examination.marks) {
      examination.marks = [];
    }

    for (const subject of validatedData.subjects) {
      let status = (subject.status || '').toUpperCase();
      const isAbsent = subject.isAbsent || status === 'ABSENT';
      let marksObtained = isAbsent ? null : subject.marksObtained ?? null;

      let subjectCode = subject.subjectCode?.trim() || '';
      let subjectName = subject.subjectName?.trim() || '';

      if (!subjectName || !subjectCode) {
        const match = courseSubjects.find(
          (cs) =>
            (subjectCode && cs.code.toLowerCase() === subjectCode.toLowerCase()) ||
            (subjectName && cs.name.toLowerCase() === subjectName.toLowerCase())
        );
        if (match) {
          if (!subjectCode) subjectCode = match.code;
          if (!subjectName) subjectName = match.name;
        }
      }

      if (!status) {
        if (isAbsent) {
          status = 'ABSENT';
        } else if (marksObtained !== null && marksObtained !== undefined) {
          status = marksObtained >= 50 ? 'PASS' : 'FAIL';
        }
      } else if (!isAbsent) {
        if (status === 'PASS' && (marksObtained === null || marksObtained === undefined || marksObtained < 50)) {
          marksObtained = 100;
        } else if (status === 'FAIL' && (marksObtained === null || marksObtained === undefined || marksObtained >= 50)) {
          marksObtained = 0;
        }
      }

      const marksData = {
        subjectCode: subjectCode || `SUB-${Date.now()}`,
        subjectName: subjectName || 'Subject',
        marksObtained,
        totalMarks: subject.totalMarks || 100,
        isAbsent,
        grade: isAbsent ? 'ABSENT' : calculateGrade(marksObtained, subject.totalMarks || 100),
        status,
        updatedBy: req.user._id,
        updatedAt: new Date(),
      };

      const existingIndex = examination.marks.findIndex((m) => m.subjectCode === subjectCode);
      if (existingIndex !== -1) {
        examination.marks[existingIndex] = marksData;
      } else {
        examination.marks.push(marksData);
      }
    }

    // Mark examinations array as modified so Mongoose persists nested updates
    student.markModified('examinations');
    await student.save({ validateModifiedOnly: true });

    emitEvent('MARKS_UPDATED', { studentId: student._id, examinationNumber: examNum });

    return sendSuccess({
      req,
      res,
      message: 'Student marks updated successfully',
      data: {
        id: student._id,
        _id: student._id,
        enrollmentId: student.enrollmentId,
        fullName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        examinationNumber: examNum,
        marks: enrichMarksWithCourseSubjects(examination.marks || [], courseSubjects),
        attendancePercentage: examination.attendancePercentage || 0,
        thesisApproved: examination.thesisApproved || false,
        eligibilityStatus: examination.eligibilityStatus || 'Pending',
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
    const examNum = validatedData.examinationNumber;

    for (const studentData of validatedData.students) {
      try {
        const query: any = { _id: studentData.studentId };

        if (req.user.role === 'institute') {
          const instituteIdForUser = await getInstituteId(req.user._id);
          if (!instituteIdForUser) {
            errors.push({ studentId: studentData.studentId, error: 'Access Denied' });
            continue;
          }
          query.institute = instituteIdForUser;
        }

        const student = await Student.findOne(query);
        if (!student) {
          errors.push({ studentId: studentData.studentId, error: 'Student not found' });
          continue;
        }

        let examinationIndex = student.examinations.findIndex((s) => s.examinationNumber === examNum);

        if (examinationIndex === -1) {
          student.examinations.push({
            examinationNumber: examNum,
            attendancePercentage: 0,
            thesisApproved: false,
            eligibilityStatus: 'Pending',
            marks: [],
          });
          examinationIndex = student.examinations.length - 1;
        }

        const examination = student.examinations[examinationIndex];
        if (!examination.marks) {
          examination.marks = [];
        }

        const courseSubjects = await getCourseSubjectsList(student.course, examNum);

        for (const subject of studentData.subjects) {
          let status = (subject.status || '').toUpperCase();
          const isAbsent = subject.isAbsent || status === 'ABSENT';
          let marksObtained = isAbsent ? null : subject.marksObtained ?? null;

          let subjectCode = subject.subjectCode?.trim() || '';
          let subjectName = subject.subjectName?.trim() || '';

          if (!subjectName || !subjectCode) {
            const match = courseSubjects.find(
              (cs) =>
                (subjectCode && cs.code.toLowerCase() === subjectCode.toLowerCase()) ||
                (subjectName && cs.name.toLowerCase() === subjectName.toLowerCase())
            );
            if (match) {
              if (!subjectCode) subjectCode = match.code;
              if (!subjectName) subjectName = match.name;
            }
          }

          if (!status) {
            if (isAbsent) {
              status = 'ABSENT';
            } else if (marksObtained !== null && marksObtained !== undefined) {
              status = marksObtained >= 50 ? 'PASS' : 'FAIL';
            }
          } else if (!isAbsent) {
            if (status === 'PASS' && (marksObtained === null || marksObtained === undefined || marksObtained < 50)) {
              marksObtained = 100;
            } else if (status === 'FAIL' && (marksObtained === null || marksObtained === undefined || marksObtained >= 50)) {
              marksObtained = 0;
            }
          }

          const marksData = {
            subjectCode: subjectCode || `SUB-${Date.now()}`,
            subjectName: subjectName || 'Subject',
            marksObtained,
            totalMarks: subject.totalMarks || 100,
            isAbsent,
            grade: isAbsent ? 'ABSENT' : calculateGrade(marksObtained, subject.totalMarks || 100),
            status,
            updatedBy: req.user._id,
            updatedAt: new Date(),
          };

          const existingIndex = examination.marks.findIndex((m) => m.subjectCode === subjectCode);
          if (existingIndex !== -1) {
            examination.marks[existingIndex] = marksData;
          } else {
            examination.marks.push(marksData);
          }
        }

        // Mark examinations array as modified so Mongoose persists nested updates
        student.markModified('examinations');
        await student.save({ validateModifiedOnly: true });

        emitEvent('MARKS_UPDATED', { studentId: student._id, examinationNumber: examNum });
        results.push({
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
    const { examinationNumber } = req.query;
    const examNum = examinationNumber ? parseInt(examinationNumber as string, 10) : 1;

    const subjects = await getCourseSubjectsList(courseId, examNum);

    const subjectList = subjects.map((sub, index) => ({
      code: sub.code || `SUB${index + 1}`,
      name: sub.name || `Subject ${index + 1}`,
      subjectCode: sub.code || `SUB${index + 1}`,
      subjectName: sub.name || `Subject ${index + 1}`,
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
  examinationNumber: z.coerce.number().min(1).max(2),
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
        // Find the examination record
        const examinationRecord = student.examinations.find(
          (s: any) => s.examinationNumber === validatedData.examinationNumber
        );

        if (!examinationRecord || !examinationRecord.marks || examinationRecord.marks.length === 0) {
          errors.push({
            studentId: student._id,
            name: `${student.firstName} ${student.lastName}`,
            reason: 'No marks found for this examination',
          });
          continue;
        }

        // Check if all subjects have marks or are marked absent
        const allMarked = examinationRecord.marks.every(
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
        const subjects = examinationRecord.marks.map((m: any) => {
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
          examination: validatedData.examinationNumber,
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
            examination: validatedData.examinationNumber,
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

// ─── Publish Results Helper ──────────────────────────────────────────────────

export const parsePublishDateTime = (dateInput: string | Date, timeStr?: string): Date => {
  let year: number;
  let monthIndex: number;
  let day: number;

  if (dateInput instanceof Date) {
    year = dateInput.getFullYear();
    monthIndex = dateInput.getMonth();
    day = dateInput.getDate();
  } else {
    const cleanDate = dateInput.includes('T') ? dateInput.split('T')[0] : dateInput;
    const parts = cleanDate.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      year = parts[0];
      monthIndex = parts[1] - 1;
      day = parts[2];
    } else {
      const d = new Date(dateInput);
      year = d.getFullYear();
      monthIndex = d.getMonth();
      day = d.getDate();
    }
  }

  let hours = 0;
  let minutes = 0;

  if (timeStr) {
    const trimmed = timeStr.trim();
    // 24-hour format: "HH:MM" or "HH:MM:SS"
    const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (match24) {
      hours = parseInt(match24[1], 10);
      minutes = parseInt(match24[2], 10);
    } else {
      // 12-hour format: "6 PM", "06:00 PM", "6:30am", "6:00"
      const match12 = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
      if (match12) {
        let h = parseInt(match12[1], 10);
        const m = match12[2] ? parseInt(match12[2], 10) : 0;
        const ampm = match12[3] ? match12[3].toUpperCase() : null;

        if (ampm === 'PM' && h < 12) {
          h += 12;
        } else if (ampm === 'AM' && h === 12) {
          h = 0;
        }
        hours = h;
        minutes = m;
      }
    }
  }

  return new Date(year, monthIndex, day, hours, minutes, 0, 0);
};

// ─── Publish Results ──────────────────────────────────────────────────────────

const publishResultsSchema = z.object({
  examinationNumber: z.coerce.number().min(1).max(2),
  batchId: z.string().min(1),
  courseId: z.string().min(1),
  academicYear: z.string().min(1),
  publishDate: z.string().min(1),
  publishTime: z.string().min(1),
  selectedStudentIds: z.array(z.string()).optional(),
  sendNotifications: z.boolean().default(false),
});

export const publishResults = async (req: Request, res: Response) => {
  try {
    const validatedData = publishResultsSchema.parse(req.body);
    const userId = req.user._id;

    const scheduledDate = parsePublishDateTime(validatedData.publishDate, validatedData.publishTime);
    if (isNaN(scheduledDate.getTime())) {
      return sendError({ req, res, statusCode: 400, message: 'Invalid publication date or time provided.' });
    }

    const now = new Date();
    const isFuture = scheduledDate.getTime() > now.getTime();

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
      examination: validatedData.examinationNumber,
      academicYear: validatedData.academicYear,
    }).populate('student');

    if (results.length === 0) {
      return sendError({ req, res, statusCode: 404, message: 'No results found to publish.' });
    }

    let publishedCount = 0;
    let skippedCount = 0;
    const publishedResults: any[] = [];

    for (const result of results) {
      // If already live-published in the past, skip
      if (result.isPublished) {
        const isAlreadyLive = result.publishedDate && new Date(result.publishedDate) <= now;
        if (isAlreadyLive) {
          skippedCount++;
          continue;
        }
        // If it was scheduled for future, allow updating/rescheduling to new date/time
      }

      result.isPublished = true;
      result.publishedDate = scheduledDate;

      const deadline = new Date(scheduledDate);
      deadline.setDate(deadline.getDate() + 10);
      result.revaluationDeadline = deadline;
      result.isRevaluationActive = !isFuture;

      result.auditHistory.push({
        action: 'PUBLISHED',
        performedBy: userId,
        timestamp: now,
      });

      await result.save();
      publishedCount++;
      publishedResults.push(result);
    }

    // Generate certificates for passed students if live publishing immediately
    if (validatedData.sendNotifications && !isFuture) {
      for (const result of publishedResults) {
        if (result.resultStatus === 'PASS') {
          console.log(`[MOCK] Generating provisional certificate for student: ${result.student}`);
        }
      }
    }

    const statusText = isFuture ? 'Scheduled' : 'Published';
    const message = isFuture
      ? `Successfully scheduled ${publishedCount} results for publication on ${scheduledDate.toLocaleDateString()} at ${validatedData.publishTime}. Results will automatically become visible to institutes and students at that time.`
      : `Published ${publishedCount} results successfully (${skippedCount} already published).`;

    return sendSuccess({
      req,
      res,
      message,
      data: {
        status: statusText,
        isScheduled: isFuture,
        publishedCount,
        skippedCount,
        totalResults: results.length,
        publishedResults,
        publishDate: scheduledDate,
        publishTime: validatedData.publishTime,
        scheduledDate,
        notificationsSent: validatedData.sendNotifications && !isFuture,
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
    const { batchId, courseId, examinationNumber } = req.query;

    const query: any = {};
    if (batchId) query.batch = batchId;
    if (courseId) query.course = courseId;

    const examNum = examinationNumber ? parseInt(examinationNumber as string, 10) : 1;

    // Get all students with marks status
    const students = await Student.find(query)
      .populate('course', 'name')
      .populate('batch', 'year name');

    const studentIds = students.map((s) => s._id);

    // Which students already have a Result for this examination
    const existingResults = await Result.find({
      student: { $in: studentIds },
      examination: examNum,
    }).select('student isPublished publishedDate');

    const resultMap = new Map();
    for (const r of existingResults) {
      resultMap.set(String(r.student), r);
    }

    const now = new Date();

    const statusData = students.map((student) => {
      const examinationRecord = student.examinations.find(
        (s: any) => s.examinationNumber === examNum
      );

      const hasMarks = examinationRecord?.marks && examinationRecord.marks.length > 0;
      const allMarked = examinationRecord?.marks
        ? examinationRecord.marks.every(
            (m: any) => m.isAbsent === true || m.marksObtained !== null
          )
        : false;

      const resultRecord = resultMap.get(String(student._id));
      const resultExists = !!resultRecord;
      const isPublished = resultExists && !!resultRecord.isPublished;
      const isScheduled = isPublished && resultRecord.publishedDate && new Date(resultRecord.publishedDate) > now;
      const isLivePublished = isPublished && !isScheduled;

      let status = 'No Marks';
      if (isScheduled) {
        status = 'Scheduled';
      } else if (isLivePublished) {
        status = 'Published';
      } else if (hasMarks && allMarked) {
        status = 'Ready';
      } else if (hasMarks) {
        status = 'Partial';
      }

      return {
        studentId: student._id,
        name: `${student.firstName} ${student.lastName}`,
        enrollmentId: student.enrollmentId,
        hasMarks: hasMarks || false,
        allMarked: hasMarks ? allMarked : false,
        resultExists,
        isPublished,
        isScheduled,
        publishedDate: resultRecord?.publishedDate || null,
        status,
        student,
      };
    });

    const total = statusData.length;
    const ready = statusData.filter((s) => s.status === 'Ready').length;
    const partial = statusData.filter((s) => s.status === 'Partial').length;
    const noMarks = statusData.filter((s) => s.status === 'No Marks').length;
    const published = statusData.filter((s) => s.status === 'Published').length;
    const scheduled = statusData.filter((s) => s.status === 'Scheduled').length;

    return sendSuccess({
      req,
      res,
      message: 'Publication status retrieved successfully',
      data: {
        summary: { total, ready, partial, noMarks, published, scheduled },
        students: statusData,
      },
    });
  } catch (error: any) {
    return sendError({ req, res, statusCode: 500, message: error.message });
  }
};
