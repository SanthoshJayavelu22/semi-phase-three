import path from 'path';
import fs from 'fs';
import { Result } from '../models/resultModel';

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

class PdfGeneratorService {
  getUploadsDir(): string {
    const dir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async generateMarksheetPDF(data: any): Promise<string> {
    const { student, result, marksheetNumber } = data;
    const studentName = student.firstName && student.lastName
      ? `${student.firstName} ${student.lastName}`
      : student.name || student.enrollmentId;

    const filename = `${marksheetNumber}.txt`;
    const dir = path.join(this.getUploadsDir(), 'marksheets');
    this.ensureDir(dir);
    const filepath = path.join(dir, filename);

    const content = [
      'MARKSHEET',
      '=========',
      `Marksheet Number: ${marksheetNumber}`,
      `Student Name: ${studentName}`,
      `Enrollment ID: ${student.enrollmentId}`,
      `Academic Year: ${result.academicYear}`,
      `Semester: ${result.semester}`,
      `Total Marks: ${result.totalMarks}`,
      `Percentage: ${result.percentage}%`,
      `CGPA: ${result.cgpa}`,
      `Division: ${result.division}`,
      '',
      'Subject Details:',
      result.subjects.map((s: any) =>
        `  ${s.subjectCode} - ${s.subjectName}: Internal=${s.internalMarks}, External=${s.externalMarks}, Total=${s.totalMarks} (${s.grade})`
      ).join('\n'),
    ].join('\n');

    fs.writeFileSync(filepath, content);
    return `/uploads/marksheets/${filename}`;
  }

  async generateProvisionalCertificatePDF(data: any): Promise<string> {
    const { student, result, certNumber } = data;
    const studentName = student.firstName && student.lastName
      ? `${student.firstName} ${student.lastName}`
      : student.name || student.enrollmentId;

    const filename = `${certNumber}.txt`;
    const dir = path.join(this.getUploadsDir(), 'certificates');
    this.ensureDir(dir);
    const filepath = path.join(dir, filename);

    const content = [
      'PROVISIONAL CERTIFICATE',
      '=======================',
      `Certificate Number: ${certNumber}`,
      '',
      `This is to certify that ${studentName}`,
      `(Enrollment ID: ${student.enrollmentId})`,
      `has successfully completed the ${result.semester} semester`,
      `of the academic year ${result.academicYear}`,
      '',
      `CGPA: ${result.cgpa}`,
      `Division: ${result.division}`,
      '',
      `Date: ${formatDate(new Date())}`,
    ].join('\n');

    fs.writeFileSync(filepath, content);
    return `/uploads/certificates/${filename}`;
  }

  async generateRevaluationReportPDF(data: any): Promise<string> {
    const { request, results } = data;

    const filename = `revaluation-report-${request.requestId}.txt`;
    const dir = path.join(this.getUploadsDir(), 'revaluation-reports');
    this.ensureDir(dir);
    const filepath = path.join(dir, filename);

    const student = request.student || {};
    const studentName = student.firstName && student.lastName
      ? `${student.firstName} ${student.lastName}`
      : student.name || 'N/A';

    const content = [
      'REVALUATION REPORT',
      '==================',
      `Request ID: ${request.requestId}`,
      `Student: ${studentName}`,
      `Registration: ${student.enrollmentId || 'N/A'}`,
      '',
      'Subject-wise Results:',
      ...(results || []).map((r: any) =>
        `  ${r.subjectCode}: Original: ${r.originalMarks}, Revised: ${r.revisedTotalMarks}, Change: ${r.marksChange}`
      ),
      '',
      `Final Result: ${request.finalResult || 'PENDING'}`,
    ].join('\n');

    fs.writeFileSync(filepath, content);
    return `/uploads/revaluation-reports/${filename}`;
  }
}

export default new PdfGeneratorService();
