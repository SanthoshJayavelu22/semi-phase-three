import { RevaluationRequest } from '../models/revaluationRequestModel';
import { RevaluationResult } from '../models/revaluationResultModel';
import { Result } from '../models/resultModel';
import { emitEvent } from '../config/socket';

class RevaluationService {
  generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `REV-${timestamp}-${random}`.toUpperCase();
  }

  async getRequestsWithPagination(query: any, options: any) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      RevaluationRequest.find(query)
        .populate(options.populate || [])
        .sort(options.sort || { submittedDate: -1 })
        .skip(skip)
        .limit(limit),
      RevaluationRequest.countDocuments(query),
    ]);

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async processRevaluationResults(requestId: string) {
    const request = await RevaluationRequest.findById(requestId);
    if (!request) {
      throw new Error('Revaluation request not found');
    }

    const revalResults = await RevaluationResult.find({
      revaluationRequest: requestId,
      reviewStatus: 'APPROVED',
    });

    let allApproved = revalResults.length === request.subjects.length;
    let hasChanges = false;

    for (const revalResult of revalResults) {
      if (revalResult.marksChange !== 0) {
        hasChanges = true;
      }
    }

    request.finalResult = hasChanges ? 'CHANGED' : 'UNCHANGED';

    if (allApproved) {
      request.status = 'COMPLETED';
      request.evaluatedDate = request.evaluatedDate || new Date();
    }

    await request.save();

    // Update the original result with all approved revaluation changes
    if (revalResults.length > 0) {
      await this.updateResultWithRevaluation(requestId);
    }

    // Emit event for real-time updates
    emitEvent('REVALUATION_PROCESSED', {
      requestId: request._id,
      finalResult: request.finalResult,
      studentId: request.student,
    });

    return { request, allApproved, hasChanges, revaluationResults: revalResults };
  }

  async updateResultWithRevaluation(requestId: string) {
    const request = await RevaluationRequest.findById(requestId);
    if (!request) {
      throw new Error('Revaluation request not found');
    }

    const result = await Result.findById(request.result);
    if (!result) {
      throw new Error('Result not found');
    }

    const revalResults = await RevaluationResult.find({
      revaluationRequest: requestId,
      reviewStatus: 'APPROVED',
    });

    const previousSubjects = result.subjects.map((s: any) => s.toObject());

    // Update each subject in the result
    for (const reval of revalResults) {
      const subjectIndex = result.subjects.findIndex(
        (s: any) => s.subjectCode === reval.subjectCode
      );

      if (subjectIndex === -1) continue;

      (result.subjects[subjectIndex] as any).totalMarks = reval.revisedTotalMarks;
      (result.subjects[subjectIndex] as any).grade = reval.revisedGrade;
      (result.subjects[subjectIndex] as any).isRevaluationApplied = true;
      (result.subjects[subjectIndex] as any).revaluationMarks = reval.revisedTotalMarks;
      (result.subjects[subjectIndex] as any).revaluationGrade = reval.revisedGrade;
      (result.subjects[subjectIndex] as any).isRevaluationCompleted = true;
    }

    const totalMarks = result.subjects.reduce((sum: number, s: any) => sum + (s.totalMarks || 0), 0);
    const maxMarks = result.subjects.length * 100;
    const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;

    result.totalMarks = totalMarks;
    result.percentage = parseFloat(percentage.toFixed(2));

    const gradePoints = result.subjects.map((subject: any) => {
      const marks = subject.totalMarks || 0;
      if (marks >= 90) return 10;
      if (marks >= 80) return 9;
      if (marks >= 70) return 8;
      if (marks >= 60) return 7;
      if (marks >= 50) return 6;
      if (marks >= 40) return 5;
      return 0;
    });

    const totalGradePoints = gradePoints.reduce((sum: number, gp: number) => sum + gp, 0);
    result.sgpa = parseFloat((totalGradePoints / result.subjects.length).toFixed(2));
    result.cgpa = result.sgpa;

    if (percentage >= 60) {
      result.division = 'First';
      result.resultStatus = 'PASS';
    } else if (percentage >= 50) {
      result.division = 'Second';
      result.resultStatus = 'PASS';
    } else if (percentage >= 40) {
      result.division = 'Third';
      result.resultStatus = 'PASS';
    } else if (percentage >= 35) {
      result.division = 'Pass';
      result.resultStatus = 'PASS';
    } else {
      const failedSubjects = result.subjects.filter((s: any) => (s.totalMarks || 0) < 35);
      if (failedSubjects.length <= 2) {
        result.resultStatus = 'SUPPLEMENTARY';
      } else {
        result.resultStatus = 'FAIL';
      }
    }

    result.auditHistory.push({
      action: 'REVALUATION_UPDATED' as any,
      previousData: { subjects: previousSubjects },
      newData: { subjects: result.subjects.map((s: any) => s.toObject()) },
      performedBy: (revalResults[0]?.reviewedBy || request.assignedEvaluator) as any,
      timestamp: new Date(),
    });

    await result.save();

    // Emit event for real-time updates
    emitEvent('RESULT_UPDATED', {
      resultId: result._id,
      studentId: result.student,
    });

    return result;
  }

  async checkEligibility(studentId: string, resultId: string, subjectCodes: string[]) {
    const result = await Result.findById(resultId);
    if (!result) {
      return { eligible: false, message: 'Result not found', eligibleSubjects: [] };
    }

    if (!result.isRevaluationActive) {
      return { eligible: false, message: 'Revaluation is not active for this result', eligibleSubjects: [] };
    }

    if (result.revaluationDeadline && new Date() > result.revaluationDeadline) {
      return { eligible: false, message: 'Revaluation deadline has passed', eligibleSubjects: [] };
    }

    const existingRequest = await RevaluationRequest.findOne({
      student: studentId,
      result: resultId,
      status: { $in: ['PENDING', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS'] },
    });

    if (existingRequest) {
      return { eligible: false, message: 'Student has already applied for revaluation', eligibleSubjects: [] };
    }

    const validSubjects: string[] = [];
    const invalidSubjects: string[] = [];

    result.subjects.forEach((subject: any) => {
      if (subjectCodes.includes(subject.subjectCode)) {
        if (subject.totalMarks < 40) {
          validSubjects.push(subject.subjectCode);
        } else {
          invalidSubjects.push(subject.subjectCode);
        }
      }
    });

    if (invalidSubjects.length > 0) {
      return {
        eligible: false,
        message: `Subjects ${invalidSubjects.join(', ')} are not eligible for revaluation (marks >= 40)`,
        eligibleSubjects: validSubjects,
        ineligibleSubjects: invalidSubjects,
      };
    }

    if (validSubjects.length === 0) {
      return { eligible: false, message: 'No eligible subjects found for revaluation', eligibleSubjects: [] };
    }

    return { eligible: true, message: 'Student is eligible for revaluation', eligibleSubjects: validSubjects };
  }

  async getRevaluationStatistics(filters: any) {
    const query: any = {};
    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.semester) query.semester = parseInt(filters.semester);

    const requests = await RevaluationRequest.find(query);

    const totalRequests = requests.length;
    const pending = requests.filter((r) => r.status === 'PENDING').length;
    const underReview = requests.filter((r) => r.status === 'UNDER_REVIEW').length;
    const assigned = requests.filter((r) => r.status === 'ASSIGNED').length;
    const inProgress = requests.filter((r) => r.status === 'IN_PROGRESS').length;
    const completed = requests.filter((r) => r.status === 'COMPLETED').length;
    const rejected = requests.filter((r) => r.status === 'REJECTED').length;

    const completedRequests = requests.filter((r) => r.status === 'COMPLETED' && r.evaluatedDate);
    let averageCompletionTime = 0;
    if (completedRequests.length > 0) {
      const totalTime = completedRequests.reduce((sum, r) => {
        const time = (r.evaluatedDate!.getTime() - r.submittedDate.getTime()) / (1000 * 60 * 60 * 24);
        return sum + time;
      }, 0);
      averageCompletionTime = totalTime / completedRequests.length;
    }

    const subjectStats: Record<string, any> = {};
    requests.forEach((request) => {
      request.subjects.forEach((subject: any) => {
        if (!subjectStats[subject.subjectCode]) {
          subjectStats[subject.subjectCode] = {
            subjectName: subject.subjectName,
            totalRequests: 0,
            changed: 0,
            unchanged: 0,
          };
        }
        subjectStats[subject.subjectCode].totalRequests++;
      });
    });

    const revalResults = await RevaluationResult.find({
      revaluationRequest: { $in: requests.map((r) => r._id) },
      reviewStatus: 'APPROVED',
    });

    revalResults.forEach((result) => {
      if (subjectStats[result.subjectCode]) {
        if (result.marksChange !== 0) {
          subjectStats[result.subjectCode].changed++;
        } else {
          subjectStats[result.subjectCode].unchanged++;
        }
      }
    });

    return {
      totalRequests,
      pending,
      underReview,
      assigned,
      inProgress,
      completed,
      rejected,
      completionRate: totalRequests > 0 ? ((completed / totalRequests) * 100).toFixed(2) : 0,
      averageCompletionTime: parseFloat(averageCompletionTime.toFixed(2)),
      subjectStatistics: subjectStats,
      totalSubjects: Object.keys(subjectStats).length,
    };
  }
}

export default new RevaluationService();
