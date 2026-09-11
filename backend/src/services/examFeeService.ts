import { Result } from '../models/resultModel';
import { Student } from '../models/studentModel';

/**
 * A student is considered "reappearing" for an examination when the most recent
 * published result carries a non-PASS status (FAIL / SUPPLEMENTARY /
 * REVALUATION_PENDING), i.e. they must sit the same examination again.
 *
 * First attempt (not reappearing) = no prior result, OR a PASS status.
 */
export const checkStudentReappearance = async (
  studentId: string,
  examinationNumber: number
) => {
  const results = await Result.find({
    student: studentId,
    examination: examinationNumber,
    isPublished: true,
  }).sort({ createdAt: -1 });

  if (results.length === 0) {
    return { isReappearing: false, attemptCount: 1, previousResult: null };
  }

  const latestResult = results[0];
  const isReappearing =
    latestResult.resultStatus === 'FAIL' ||
    latestResult.resultStatus === 'SUPPLEMENTARY' ||
    latestResult.resultStatus === 'REVALUATION_PENDING';

  return {
    isReappearing,
    attemptCount: results.length,
    previousResult: latestResult,
    previousAttempts: results,
  };
};

/**
 * Safely read a per-examination fee config entry from a course.
 *
 * `examFeeConfig` is a Mongoose Map (schema `type: Map`), which only supports
 * `.get()`/`.set()`. Bracket access does NOT work on mongoose Map instances and
 * silently returns `undefined`. This helper supports both mongoose Maps and
 * legacy plain-object hydration so reads never silently fall back to defaults.
 */
export const getExamFeeConfigEntry = (course: any, examinationNumber: number) => {
  const map = course?.examFeeConfig;
  if (!map) return undefined;
  const key = `exam_${examinationNumber}`;
  return typeof map.get === 'function' ? map.get(key) : map[key];
};

/**
 * Safely write a per-examination fee config entry onto a course.
 *
 * Uses the mongoose Map `.set()` API (which persists on save) and falls back to
 * plain-object assignment for legacy documents that were never hydrated as a
 * Map.
 */
export const setExamFeeConfigEntry = (course: any, examinationNumber: number, value: any) => {
  const key = `exam_${examinationNumber}`;
  if (course.examFeeConfig && typeof course.examFeeConfig.set === 'function') {
    course.examFeeConfig.set(key, value);
  } else {
    if (!course.examFeeConfig) course.examFeeConfig = {};
    (course.examFeeConfig as any)[key] = value;
  }
  return course;
};

/**
 * Resolve the applicable fee for a course/examination and whether a fee applies
 * at all. Fee configuration can be supplied per-course/per-examination (via the
 * `examFeeConfig` Map), otherwise falls back to the course-level fields.
 *
 * First-attempt fee defaults to 0 (waived) unless the course opts in via
 * `feeApplicableForFirstAttempt`.
 */
export const resolveFeeConfiguration = (
  course: any,
  examinationNumber: number
) => {
  let firstAttemptFee = 0;
  let reappearingFee = 0;
  let feeApplicableForFirstAttempt = false;

  const perExam = getExamFeeConfigEntry(course, examinationNumber);
  if (perExam) {
    // Use nullish coalescing so an explicit 0 (fee removed) is respected.
    firstAttemptFee =
      perExam.firstAttemptFee !== undefined && perExam.firstAttemptFee !== null
        ? Number(perExam.firstAttemptFee) || 0
        : Number(course?.examinationFee) || 0;
    reappearingFee =
      perExam.reappearingFee !== undefined && perExam.reappearingFee !== null
        ? Number(perExam.reappearingFee) || 0
        : Number(course?.reappearingExaminationFee) ||
          Number(course?.examinationFee) ||
          0;
    feeApplicableForFirstAttempt =
      Boolean(perExam.feeApplicableForFirstAttempt);
  } else {
    firstAttemptFee = Number(course?.examinationFee) || 0;
    reappearingFee =
      Number(course?.reappearingExaminationFee) ||
      Number(course?.examinationFee) ||
      0;
    feeApplicableForFirstAttempt =
      Boolean(course?.feeApplicableForFirstAttempt);
  }

  // Reappearing students always pay the reappearing fee.
  return {
    firstAttemptFee,
    reappearingFee,
    feeApplicableForFirstAttempt,
    feeForAttempt: (isReappearing: boolean) =>
      isReappearing ? reappearingFee : feeApplicableForFirstAttempt ? firstAttemptFee : 0,
  };
};

/**
 * Classify a list of students into first-attempt vs reappearing for a given
 * examination, and compute the total applicable exam fee.
 *
 * Returns per-student classification plus summary fee fields suitable for
 * persisting onto an ExamApplication.
 */
export const classifyStudentsForExamFee = async (
  studentIds: string[],
  examinationNumber: number,
  course: any
) => {
  const reappearingStudents: string[] = [];
  const firstAttemptStudents: string[] = [];

  for (const studentId of studentIds) {
    const status = await checkStudentReappearance(studentId, examinationNumber);
    if (status.isReappearing) {
      reappearingStudents.push(studentId);
    } else {
      firstAttemptStudents.push(studentId);
    }
  }

  const feeConfig = resolveFeeConfiguration(course, examinationNumber);

  const examFeeApplicable = reappearingStudents.length > 0
    ? feeConfig.reappearingFee > 0
    : feeConfig.firstAttemptFee > 0 && feeConfig.feeApplicableForFirstAttempt;

  const reappearingFeeAmount = reappearingStudents.length * feeConfig.reappearingFee;
  const firstAttemptFeeAmount = feeConfig.feeApplicableForFirstAttempt
    ? firstAttemptStudents.length * feeConfig.firstAttemptFee
    : 0;

  return {
    reappearingStudents,
    firstAttemptStudents,
    reappearingCount: reappearingStudents.length,
    firstAttemptCount: firstAttemptStudents.length,
    feePerReappearing: feeConfig.reappearingFee,
    feePerFirstAttempt: feeConfig.firstAttemptFee,
    examFeeApplicable,
    examFeeAmount: reappearingFeeAmount + firstAttemptFeeAmount,
    reappearingFeeAmount,
    firstAttemptFeeAmount,
    feeConfig,
  };
};