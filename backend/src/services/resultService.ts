import { Result, IResult } from '../models/resultModel';
import { Student } from '../models/studentModel';

class ResultService {
  calculateResultMetrics(subjects: any[]) {
    const totalMarks = subjects.reduce((sum: number, subject: any) => sum + (subject.totalMarks || 0), 0);
    const totalCredits = subjects.reduce((sum: number, subject: any) => sum + (subject.credits || 0), 0);
    const maxMarks = subjects.length * 100;
    const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;

    const gradePoints = subjects.map((subject: any) => {
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
    const sgpa = subjects.length > 0 ? totalGradePoints / subjects.length : 0;
    const cgpa = sgpa;

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
    } else {
      const failedSubjects = subjects.filter((s: any) => (s.totalMarks || 0) < 35);
      if (failedSubjects.length <= 2) {
        resultStatus = 'SUPPLEMENTARY';
      }
    }

    return {
      totalMarks,
      totalCredits,
      percentage: parseFloat(percentage.toFixed(2)),
      cgpa: parseFloat(cgpa.toFixed(2)),
      sgpa: parseFloat(sgpa.toFixed(2)),
      division,
      resultStatus,
    };
  }

  async getResultsWithPagination(query: any, options: any) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      Result.find(query)
        .populate(options.populate || [])
        .sort(options.sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Result.countDocuments(query),
    ]);

    return {
      results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async advancedSearch(filters: any) {
    const query: any = { isPublished: true };

    if (filters.query) {
      const students = await Student.find({
        $or: [
          { firstName: { $regex: filters.query, $options: 'i' } },
          { lastName: { $regex: filters.query, $options: 'i' } },
          { enrollmentId: { $regex: filters.query, $options: 'i' } },
        ],
      }).select('_id');
      query.student = { $in: students.map((s) => s._id) };
    }

    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.semester) query.semester = parseInt(filters.semester);
    if (filters.resultStatus) query.resultStatus = filters.resultStatus;

    if (filters.fromDate || filters.toDate) {
      query.publishedDate = {};
      if (filters.fromDate) query.publishedDate.$gte = new Date(filters.fromDate);
      if (filters.toDate) query.publishedDate.$lte = new Date(filters.toDate);
    }

    if (filters.department) {
      const students = await Student.find({
        $or: [
          { firstName: { $regex: filters.department, $options: 'i' } },
          { lastName: { $regex: filters.department, $options: 'i' } },
        ],
      }).select('_id');
      query.student = { $in: students.map((s) => s._id) };
    }

    return await Result.find(query)
      .populate('student', 'firstName lastName enrollmentId email')
      .sort({ publishedDate: -1 });
  }

  async getResultStatistics(filters: any) {
    const query: any = { isPublished: true };
    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.semester) query.semester = parseInt(filters.semester);

    const results = await Result.find(query);

    const total = results.length;
    const passed = results.filter((r) => r.resultStatus === 'PASS').length;
    const failed = results.filter((r) => r.resultStatus === 'FAIL').length;
    const supplementary = results.filter((r) => r.resultStatus === 'SUPPLEMENTARY').length;

    const totalMarks = results.reduce((sum, r) => sum + r.totalMarks, 0);
    const averageMarks = total > 0 ? totalMarks / total : 0;

    const totalPercentage = results.reduce((sum, r) => sum + r.percentage, 0);
    const averagePercentage = total > 0 ? totalPercentage / total : 0;

    const gradeDistribution: Record<string, number> = {
      O: 0, 'A+': 0, A: 0, 'B+': 0, B: 0, C: 0, D: 0, F: 0,
    };

    results.forEach((result) => {
      result.subjects.forEach((subject: any) => {
        if (subject.grade in gradeDistribution) {
          gradeDistribution[subject.grade]++;
        }
      });
    });

    return {
      totalResults: total,
      passed,
      failed,
      supplementary,
      passPercentage: total > 0 ? ((passed / total) * 100).toFixed(2) : 0,
      averageMarks: parseFloat(averageMarks.toFixed(2)),
      averagePercentage: parseFloat(averagePercentage.toFixed(2)),
      gradeDistribution,
      subjectCount: results.reduce((sum, r) => sum + r.subjects.length, 0),
    };
  }

  async bulkUpload(results: any[], userId: string) {
    const uploaded: IResult[] = [];

    for (const resultData of results) {
      try {
        const student = await Student.findById(resultData.student);
        if (!student) continue;

        const existingResult = await Result.findOne({
          student: resultData.student,
          academicYear: resultData.academicYear,
          semester: resultData.semester,
        });

        if (existingResult) continue;

        const calculatedData = this.calculateResultMetrics(resultData.subjects);
        resultData.totalMarks = calculatedData.totalMarks;
        resultData.totalCredits = calculatedData.totalCredits;
        resultData.percentage = calculatedData.percentage;
        resultData.cgpa = calculatedData.cgpa;
        resultData.sgpa = calculatedData.sgpa;
        resultData.division = calculatedData.division;
        resultData.resultStatus = calculatedData.resultStatus;

        resultData.auditHistory = [
          {
            action: 'CREATED',
            performedBy: userId,
            timestamp: new Date(),
          },
        ];

        const result = await Result.create(resultData);
        uploaded.push(result);
      } catch (error) {
        console.error(`Failed to upload result: ${(error as Error).message}`);
      }
    }

    return uploaded;
  }
}

export default new ResultService();
