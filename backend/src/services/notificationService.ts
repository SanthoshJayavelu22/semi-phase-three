// backend/src/services/notificationService.ts
import sendEmail from '../utils/sendEmail';
import { logger } from '../config/logger';

export interface EmailTemplateData {
  instituteName: string;
  instituteEmail: string;
  studentName?: string;
  studentEmail?: string;
  courseName?: string;
  semesterNumber?: number;
  examVenue?: string;
  examCenter?: string;
  examDate?: Date | string;
  reportingTime?: string;
  subjects?: string[];
  totalFee?: number;
  paymentId?: string;
  orderId?: string;
  resultStatus?: string;
  marks?: any[];
  revaluationResults?: Array<{
    subjectName?: string;
    originalMarks?: number;
    revisedTotalMarks?: number;
    marksChange?: number;
  }>;
  remarks?: string;
}

class NotificationService {
  private readonly ACADEMY_EMAIL = process.env.BOARD_EMAIL || 'admin@semiphase3.com';
  private readonly SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM || 'support@semiphase3.com';

  /**
   * Send exam application confirmation to institute and notification to academy
   */
  async notifyExamApplicationSubmitted(data: EmailTemplateData): Promise<void> {
    const { instituteName, instituteEmail, courseName, semesterNumber, subjects, totalFee, paymentId } = data;

    // 1. Institute confirmation
    await this.sendInstituteEmail({
      to: instituteEmail,
      subject: 'Exam Application Submitted - SEMI',
      template: 'exam-application-submitted-institute',
      data: {
        ...data,
        subjectsList: subjects?.join(', ') || 'N/A',
        totalFee: totalFee != null ? `₹${totalFee.toLocaleString('en-IN')}` : 'N/A',
        paymentId: paymentId || 'N/A',
      },
    });

    // 2. Academy notification
    await this.sendAcademyEmail({
      subject: '🆕 New Exam Application Submitted',
      template: 'exam-application-submitted-academy',
      data: {
        ...data,
        instituteName,
        courseName,
        semesterNumber,
        subjects: subjects?.join(', ') || 'N/A',
        totalFee: totalFee != null ? `₹${totalFee.toLocaleString('en-IN')}` : 'N/A',
        paymentId: paymentId || 'N/A',
        actionRequired: 'Please review and approve/reject this exam application.',
      },
    });
  }

  /**
   * Send exam application approval notification to institute
   */
  async notifyExamApplicationApproved(data: EmailTemplateData): Promise<void> {
    const { instituteName, instituteEmail, courseName, semesterNumber, examDate, remarks } = data;

    await this.sendInstituteEmail({
      to: instituteEmail,
      subject: '✅ Exam Application Approved - SEMI',
      template: 'exam-application-approved-institute',
      data: {
        ...data,
        examDate: examDate ? new Date(examDate).toLocaleDateString('en-IN', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }) : 'TBD',
        remarks: remarks || 'No additional remarks provided.',
        nextSteps: 'Please await schedule publication from the Academic Board.',
      },
    });
  }

  /**
   * Send exam schedule published notification to institute
   */
  async notifyExamSchedulePublished(data: EmailTemplateData): Promise<void> {
    const { instituteName, instituteEmail, courseName, semesterNumber, examVenue, examCenter, examDate, reportingTime, subjects } = data;

    await this.sendInstituteEmail({
      to: instituteEmail,
      subject: '📅 Exam Schedule Published - SEMI',
      template: 'exam-schedule-published-institute',
      data: {
        ...data,
        venue: examVenue || 'TBD',
        center: examCenter || 'TBD',
        date: examDate ? new Date(examDate).toLocaleDateString('en-IN', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }) : 'TBD',
        reportingTime: reportingTime || 'TBD',
        subjectsList: subjects?.map((s, i) => `${i + 1}. ${s}`).join('\n') || 'N/A',
        nextSteps: 'Please log in to your dashboard to generate hall tickets for eligible students.',
      },
    });
  }

  /**
   * Send exam result published notification to institute (and student if email known)
   */
  async notifyResultsPublished(data: EmailTemplateData): Promise<void> {
    const { instituteName, instituteEmail, studentName, studentEmail, courseName, semesterNumber, resultStatus } = data;

    await this.sendInstituteEmail({
      to: instituteEmail,
      subject: '📊 Results Published - SEMI',
      template: 'results-published-institute',
      data: {
        ...data,
        studentName: studentName || 'Multiple Students',
        resultStatus: resultStatus || 'Published',
        note: 'Results are now available in the ERP dashboard. Students can view their results using their enrollment ID.',
      },
    });

    if (studentEmail) {
      await sendEmail({
        email: studentEmail,
        subject: '📊 Your Examination Results - SEMI',
        message: `Dear ${studentName},\n\nYour results for ${courseName} (Semester ${semesterNumber}) are now available.\n\nStatus: ${resultStatus || 'Published'}\n\nPlease log in to the results portal using your enrollment ID to view your detailed marksheet.\n\nRegards,\nSEMI Academic Board`,
        html: this.buildHtmlEmail({
          title: 'Examination Results Available',
          greeting: `Dear ${studentName},`,
          body: `
            <p>Your results for <strong>${courseName}</strong> (Semester ${semesterNumber}) are now available.</p>
            <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0; font-weight: 600; color: #166534;">Status: ${resultStatus || 'Published'}</p>
            </div>
            <p>Please log in to the results portal using your enrollment ID to view your detailed marksheet.</p>
          `,
          footer: 'SEMI Academic Board',
        }),
      });
    }
  }

  /**
   * Send revaluation fee payment confirmation to institute and notification to academy
   */
  async notifyRevaluationPaymentSubmitted(data: EmailTemplateData): Promise<void> {
    const { instituteName, instituteEmail, studentName, studentEmail, courseName, semesterNumber, subjects, totalFee, paymentId } = data;

    await this.sendInstituteEmail({
      to: instituteEmail,
      subject: '💰 Revaluation Payment Received - SEMI',
      template: 'revaluation-payment-institute',
      data: {
        ...data,
        studentName: studentName || 'N/A',
        subjectsList: subjects?.map((s, i) => `${i + 1}. ${s}`).join('\n') || 'N/A',
        totalFee: totalFee != null ? `₹${totalFee.toLocaleString('en-IN')}` : 'N/A',
        paymentId: paymentId || 'N/A',
        nextSteps: 'Your revaluation request is now under review by the Academic Board.',
      },
    });

    await this.sendAcademyEmail({
      subject: '🔄 New Revaluation Request Submitted',
      template: 'revaluation-payment-academy',
      data: {
        ...data,
        studentName: studentName || 'N/A',
        studentEmail: studentEmail || 'N/A',
        courseName: courseName || 'N/A',
        semesterNumber: semesterNumber || 'N/A',
        subjectsList: subjects?.join(', ') || 'N/A',
        totalFee: totalFee != null ? `₹${totalFee.toLocaleString('en-IN')}` : 'N/A',
        paymentId: paymentId || 'N/A',
        actionRequired: 'Please review and process the revaluation request.',
      },
    });
  }

  /**
   * Send revaluation result update notification to institute (and student if email known)
   */
  async notifyRevaluationResultUpdated(data: EmailTemplateData): Promise<void> {
    const { instituteName, instituteEmail, studentName, studentEmail, courseName, semesterNumber, revaluationResults } = data;

    const changes = revaluationResults || [];
    const totalChange = changes.reduce((sum, r) => sum + (r.marksChange || 0), 0);
    const changeEmoji = totalChange > 0 ? '📈' : totalChange < 0 ? '📉' : '➡️';

    await this.sendInstituteEmail({
      to: instituteEmail,
      subject: `${changeEmoji} Revaluation Results Updated - SEMI`,
      template: 'revaluation-result-updated-institute',
      data: {
        ...data,
        studentName: studentName || 'N/A',
        totalChange: totalChange > 0 ? `+${totalChange}` : totalChange.toString(),
        changeEmoji,
        changesSummary: changes.map(r =>
          `${r.subjectName}: ${r.originalMarks}% → ${r.revisedTotalMarks}% (${(r.marksChange || 0) > 0 ? '+' : ''}${r.marksChange || 0}%)`
        ).join('\n'),
        nextSteps: "Updated marks are now reflected in the student's result. You can download the revised marksheet.",
      },
    });

    if (studentEmail) {
      const gradeChange = changes.map(r =>
        `${r.subjectName}: ${r.originalMarks}% → ${r.revisedTotalMarks}%`
      ).join('\n');

      await sendEmail({
        email: studentEmail,
        subject: `${changeEmoji} Revaluation Results Updated - SEMI`,
        message: `Dear ${studentName},\n\nYour revaluation request for ${courseName} (Semester ${semesterNumber}) has been processed.\n\nChanges:\n${gradeChange}\n\nOverall change: ${totalChange > 0 ? '+' : ''}${totalChange}%\n\nPlease log in to view your updated results.\n\nRegards,\nSEMI Academic Board`,
        html: this.buildHtmlEmail({
          title: 'Revaluation Results Updated',
          greeting: `Dear ${studentName},`,
          body: `
            <p>Your revaluation request for <strong>${courseName}</strong> (Semester ${semesterNumber}) has been processed.</p>
            <div style="background: #f0f9ff; border: 1px solid #7dd3fc; border-radius: 12px; padding: 16px; margin: 16px 0;">
              <p style="font-weight: 600; color: #0369a1;">Changes:</p>
              ${changes.map(r => `
                <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #e0f2fe;">
                  <span>${r.subjectName}</span>
                  <span>${r.originalMarks}% → ${r.revisedTotalMarks}% <span style="color: ${(r.marksChange || 0) > 0 ? '#16a34a' : (r.marksChange || 0) < 0 ? '#dc2626' : '#f59e0b'};">(${(r.marksChange || 0) > 0 ? '+' : ''}${r.marksChange || 0}%)</span></span>
                </div>
              `).join('')}
              <p style="margin-top: 12px; font-weight: 600;">Overall change: <span style="color: ${totalChange > 0 ? '#16a34a' : totalChange < 0 ? '#dc2626' : '#f59e0b'};">${totalChange > 0 ? '+' : ''}${totalChange}%</span></p>
            </div>
            <p>Please log in to view your updated results.</p>
          `,
          footer: 'SEMI Academic Board',
        }),
      });
    }
  }

  /**
   * Generic send to institute email with HTML template
   */
  private async sendInstituteEmail(params: { to: string; subject: string; template: string; data: any }): Promise<void> {
    const { to, subject, template, data } = params;
    const html = this.buildTemplateEmail(template, data);
    const text = this.buildPlainTextEmail(template, data);

    try {
      await sendEmail({ email: to, subject, message: text, html });
      logger.info(`Email sent to institute: ${to} | Subject: ${subject}`);
    } catch (error: any) {
      logger.error(`Failed to send institute email to ${to}: ${error?.message || error}`);
    }
  }

  /**
   * Generic send to academy email
   */
  private async sendAcademyEmail(params: { subject: string; template: string; data: any }): Promise<void> {
    const { subject, template, data } = params;
    const html = this.buildTemplateEmail(template, data);
    const text = this.buildPlainTextEmail(template, data);

    try {
      await sendEmail({ email: this.ACADEMY_EMAIL, subject, message: text, html });
      logger.info(`Email sent to academy: ${this.ACADEMY_EMAIL} | Subject: ${subject}`);
    } catch (error: any) {
      logger.error(`Failed to send academy email: ${error?.message || error}`);
    }
  }

  /**
   * Build HTML template for emails
   */
  private buildTemplateEmail(template: string, data: any): string {
    let title = 'SEMI Notification';
    let greeting = 'Dear Institute,';
    let body = '';
    const footer = 'SEMI Academic Board';

    switch (template) {
      case 'exam-application-submitted-institute':
        title = 'Exam Application Submitted';
        greeting = `Dear ${data.instituteName},`;
        body = `
          <p>Your exam application has been successfully submitted to the Academic Board.</p>
          <div style="background: #f0f9ff; border: 1px solid #7dd3fc; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p style="font-weight: 600; color: #0369a1;">Application Summary:</p>
            <p><strong>Course:</strong> ${data.courseName || 'N/A'}</p>
            <p><strong>Semester:</strong> ${data.semesterNumber || 'N/A'}</p>
            <p><strong>Subjects:</strong> ${data.subjectsList || data.subjects?.join(', ') || 'N/A'}</p>
            <p><strong>Total Fee:</strong> ${data.totalFee || 'N/A'}</p>
            <p><strong>Payment ID:</strong> ${data.paymentId || 'N/A'}</p>
          </div>
          <p>Your application is now pending review by the Academic Board.</p>
          <p style="color: #6b7280; font-size: 14px;">You will receive a notification once your application is reviewed.</p>
        `;
        break;

      case 'exam-application-submitted-academy':
        title = '📋 New Exam Application';
        greeting = 'Dear Academic Board,';
        body = `
          <p>A new exam application has been submitted by <strong>${data.instituteName}</strong>.</p>
          <div style="background: #f0f9ff; border: 1px solid #7dd3fc; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p style="font-weight: 600; color: #0369a1;">Application Details:</p>
            <p><strong>Institute:</strong> ${data.instituteName}</p>
            <p><strong>Course:</strong> ${data.courseName || 'N/A'}</p>
            <p><strong>Semester:</strong> ${data.semesterNumber || 'N/A'}</p>
            <p><strong>Subjects:</strong> ${data.subjects || 'N/A'}</p>
            <p><strong>Total Fee:</strong> ${data.totalFee || 'N/A'}</p>
            <p><strong>Payment ID:</strong> ${data.paymentId || 'N/A'}</p>
          </div>
          <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 12px; margin: 16px 0;">
            <p style="font-weight: 600; color: #92400e;">Action Required: ${data.actionRequired || 'Please review this application.'}</p>
          </div>
          <p>Please log in to the Academy Portal to review and take action.</p>
        `;
        break;

      case 'exam-application-approved-institute':
        title = '✅ Exam Application Approved';
        greeting = `Dear ${data.instituteName},`;
        body = `
          <p>We are pleased to inform you that your exam application has been <strong style="color: #16a34a;">APPROVED</strong> by the Academic Board.</p>
          <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p style="font-weight: 600; color: #166534;">Application Details:</p>
            <p><strong>Course:</strong> ${data.courseName || 'N/A'}</p>
            <p><strong>Semester:</strong> ${data.semesterNumber || 'N/A'}</p>
            <p><strong>Scheduled Date:</strong> ${data.examDate || 'TBD'}</p>
            <p><strong>Remarks:</strong> ${data.remarks || 'No additional remarks.'}</p>
          </div>
          <p><strong>Next Steps:</strong> ${data.nextSteps || 'Please await schedule publication from the Academic Board.'}</p>
          <p style="color: #6b7280; font-size: 14px;">You will receive another notification when the exam schedule is published.</p>
        `;
        break;

      case 'exam-schedule-published-institute':
        title = '📅 Exam Schedule Published';
        greeting = `Dear ${data.instituteName},`;
        body = `
          <p>The Academic Board has published the exam schedule for <strong>${data.courseName}</strong> (Semester ${data.semesterNumber}).</p>
          <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p style="font-weight: 600; color: #166534;">Exam Schedule:</p>
            <p><strong>Venue:</strong> ${data.venue || 'TBD'}</p>
            <p><strong>Center:</strong> ${data.center || 'TBD'}</p>
            <p><strong>Date:</strong> ${data.date || 'TBD'}</p>
            <p><strong>Reporting Time:</strong> ${data.reportingTime || 'TBD'}</p>
            <p><strong>Subjects:</strong></p>
            <pre style="background: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 14px;">${data.subjectsList || 'N/A'}</pre>
          </div>
          <p><strong>Next Steps:</strong> ${data.nextSteps || 'Please log in to your dashboard to generate hall tickets for eligible students.'}</p>
        `;
        break;

      case 'results-published-institute':
        title = '📊 Results Published';
        greeting = `Dear ${data.instituteName},`;
        body = `
          <p>Results have been published for <strong>${data.courseName}</strong> (Semester ${data.semesterNumber}).</p>
          <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p><strong>Student:</strong> ${data.studentName || 'Multiple Students'}</p>
            <p><strong>Status:</strong> <span style="color: ${data.resultStatus === 'PASS' ? '#16a34a' : '#dc2626'};">${data.resultStatus || 'Published'}</span></p>
          </div>
          <p><strong>Note:</strong> ${data.note || 'Results are now available in the ERP dashboard.'}</p>
        `;
        break;

      case 'revaluation-payment-institute':
        title = '💰 Revaluation Payment Received';
        greeting = `Dear ${data.instituteName},`;
        body = `
          <p>Revaluation payment has been received for <strong>${data.studentName}</strong>.</p>
          <div style="background: #f0f9ff; border: 1px solid #7dd3fc; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p style="font-weight: 600; color: #0369a1;">Payment Details:</p>
            <p><strong>Student:</strong> ${data.studentName || 'N/A'}</p>
            <p><strong>Course:</strong> ${data.courseName || 'N/A'}</p>
            <p><strong>Semester:</strong> ${data.semesterNumber || 'N/A'}</p>
            <p><strong>Subjects:</strong> ${data.subjectsList || data.subjects?.join(', ') || 'N/A'}</p>
            <p><strong>Total Fee:</strong> ${data.totalFee || 'N/A'}</p>
            <p><strong>Payment ID:</strong> ${data.paymentId || 'N/A'}</p>
          </div>
          <p><strong>Next Steps:</strong> ${data.nextSteps || 'Your revaluation request is now under review.'}</p>
        `;
        break;

      case 'revaluation-payment-academy':
        title = '🔄 New Revaluation Request';
        greeting = 'Dear Academic Board,';
        body = `
          <p>A new revaluation request has been submitted by <strong>${data.instituteName}</strong>.</p>
          <div style="background: #f0f9ff; border: 1px solid #7dd3fc; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p style="font-weight: 600; color: #0369a1;">Request Details:</p>
            <p><strong>Institute:</strong> ${data.instituteName}</p>
            <p><strong>Student:</strong> ${data.studentName || 'N/A'}</p>
            <p><strong>Email:</strong> ${data.studentEmail || 'N/A'}</p>
            <p><strong>Course:</strong> ${data.courseName || 'N/A'}</p>
            <p><strong>Semester:</strong> ${data.semesterNumber || 'N/A'}</p>
            <p><strong>Subjects:</strong> ${data.subjectsList || 'N/A'}</p>
            <p><strong>Total Fee:</strong> ${data.totalFee || 'N/A'}</p>
            <p><strong>Payment ID:</strong> ${data.paymentId || 'N/A'}</p>
          </div>
          <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 12px; margin: 16px 0;">
            <p style="font-weight: 600; color: #92400e;">Action Required: ${data.actionRequired || 'Please review and process this revaluation request.'}</p>
          </div>
          <p>Please log in to the Academy Portal to review and take action.</p>
        `;
        break;

      case 'revaluation-result-updated-institute':
        title = `${data.changeEmoji || '📋'} Revaluation Results Updated`;
        greeting = `Dear ${data.instituteName},`;
        body = `
          <p>Revaluation results have been processed for <strong>${data.studentName}</strong>.</p>
          <div style="background: #f0f9ff; border: 1px solid #7dd3fc; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p style="font-weight: 600; color: #0369a1;">Changes:</p>
            <pre style="background: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 14px;">${data.changesSummary || 'N/A'}</pre>
            <p><strong>Overall Change:</strong> <span style="color: ${Number(data.totalChange) > 0 ? '#16a34a' : Number(data.totalChange) < 0 ? '#dc2626' : '#f59e0b'};">${data.totalChange > 0 ? '+' : ''}${data.totalChange}%</span></p>
          </div>
          <p><strong>Next Steps:</strong> ${data.nextSteps || "Updated marks are now reflected in the student's result."}</p>
        `;
        break;

      default:
        body = `<p>${JSON.stringify(data, null, 2)}</p>`;
    }

    return this.buildHtmlEmail({ title, greeting, body, footer });
  }

  /**
   * Build plain text email
   */
  private buildPlainTextEmail(template: string, data: any): string {
    let text = `SEMI Notification\n\n${JSON.stringify(data, null, 2)}`;
    switch (template) {
      case 'exam-application-submitted-institute':
        text = `
Exam Application Submitted

Dear ${data.instituteName},

Your exam application has been successfully submitted to the Academic Board.

Application Summary:
- Course: ${data.courseName || 'N/A'}
- Semester: ${data.semesterNumber || 'N/A'}
- Subjects: ${data.subjectsList || data.subjects?.join(', ') || 'N/A'}
- Total Fee: ${data.totalFee || 'N/A'}
- Payment ID: ${data.paymentId || 'N/A'}

Your application is now pending review by the Academic Board.

Regards,
SEMI Academic Board
        `;
        break;

      case 'exam-schedule-published-institute':
        text = `
Exam Schedule Published

Dear ${data.instituteName},

The Academic Board has published the exam schedule for ${data.courseName} (Semester ${data.semesterNumber}).

Exam Schedule:
- Venue: ${data.venue || 'TBD'}
- Center: ${data.center || 'TBD'}
- Date: ${data.date || 'TBD'}
- Reporting Time: ${data.reportingTime || 'TBD'}
- Subjects:
${data.subjectsList || data.subjects?.map((s: string, i: number) => `  ${i + 1}. ${s}`).join('\n') || 'N/A'}

Next Steps: ${data.nextSteps || 'Please log in to your dashboard to generate hall tickets for eligible students.'}

Regards,
SEMI Academic Board
        `;
        break;

      default:
        break;
    }

    return text;
  }

  /**
   * Build HTML email wrapper
   */
  private buildHtmlEmail(params: { title: string; greeting: string; body: string; footer: string }): string {
    const { title, greeting, body, footer } = params;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      color: #1e293b;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .email-wrapper {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      padding: 40px 32px;
    }
    .header {
      text-align: center;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .badge {
      display: inline-block;
      background: #eff6ff;
      color: #2563eb;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 9999px;
      margin-top: 8px;
    }
    .content {
      font-size: 16px;
      line-height: 1.6;
      color: #334155;
    }
    .content p {
      margin: 12px 0;
    }
    .footer {
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 14px;
      color: #94a3b8;
    }
    .footer a {
      color: #2563eb;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    @media (max-width: 600px) {
      .email-wrapper {
        padding: 24px 16px;
      }
      .header h1 {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-wrapper">
      <div class="header">
        <h1>${title}</h1>
        <span class="badge">SEMI - Society for Emergency Medicine India</span>
      </div>
      <div class="content">
        <p><strong>${greeting}</strong></p>
        ${body}
        <p style="margin-top: 24px;">Regards,<br><strong>${footer}</strong></p>
      </div>
      <div class="footer">
        <p>
          <a href="https://semi.org">SEMI Official Portal</a> &bull;
          <a href="mailto:${this.SUPPORT_EMAIL}">Contact Support</a>
        </p>
        <p style="font-size: 12px; color: #cbd5e1;">
          Society for Emergency Medicine India (SEMI) &bull; Regd. No. 3602/2000
        </p>
        <p style="font-size: 12px; color: #cbd5e1;">
          This is an automated notification. Please do not reply to this email.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }
}

export default new NotificationService();
