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

  const perExam = course?.examFeeConfig?.[`exam_${examinationNumber}`];
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