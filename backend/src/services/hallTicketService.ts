// backend/src/services/hallTicketService.ts
import { HallTicket } from '../models/hallTicketModel';
import { HallTicketTemplate } from '../models/hallTicketTemplateModel';
import { IHallTicket } from '../models/hallTicketModel';
import { Institute } from '../models/instituteModel';
import pdfGeneratorService from './pdfGeneratorService';
import { randomUUID as uuidv4 } from 'crypto';

class HallTicketService {
  async createHallTicket(data: Partial<IHallTicket>): Promise<IHallTicket> {
    const hallTicketNumber = this.generateHallTicketNumber(data.examType);
    const hallTicket = new HallTicket({
      ...data,
      hallTicketNumber,
      status: 'draft'
    });
    return await hallTicket.save();
  }

  async saveHallTicketsBulk(records: any[], issuedBy?: string): Promise<IHallTicket[]> {
    const now = Date.now();

    const tickets = (Array.isArray(records) ? records : []).map((record: any) => {
      const examType = record.examType || 'CCT-EM';
      const ticketNumber = this.generateHallTicketNumber(examType);

      return new HallTicket({
        ticketId: record.ticketId || `HT-${now}-${Math.floor(1000 + Math.random() * 9000)}`,
        hallTicketNumber: ticketNumber,
        examType,
        student: record.studentId || record.student || undefined,
        enrollmentId: record.enrollmentId,
        studentName: record.studentName,
        contactNumber: record.contactNumber,
        photoUrl: record.photoUrl,
        institute: record.instituteId || record.institute,
        instituteName: record.instituteName,
        instituteAddress: record.instituteAddress,
        courseName: record.courseName,
        batchName: record.batchName,
        batchYear: record.batchYear,
        subjects: record.subjects || [],
        examDate: record.examDate,
        examVenue: record.examVenue,
        examAddress: record.examAddress,
        examCenter: record.examCenter,
        reportingTime: record.reportingTime,
        candidate: {
          name: record.studentName,
          photo: record.photoUrl,
          enrollmentId: record.enrollmentId,
          signature: record.studentSignatureUrl || record.signature,
        },
        examDetails: {
          theory: {
            centre: record.examVenue,
            address: record.examAddress,
            timeSlot: record.reportingTime,
            subjects: (record.subjects || []).map((s: any) => ({
              date: s?.date,
              paperName: s?.paperName,
              paperNumber: s?.paperNumber,
              appearing: true,
            })),
          },
          practical: record.practicalDetails
            ? {
                centre: record.practicalDetails.centre,
                address: record.practicalDetails.address,
                date: record.practicalDetails.date,
                timeSlot: record.practicalDetails.timeSlot,
                appearing: true,
                subjects: (record.practicalDetails.subjects || []).map((s: any) => ({
                  paperNumber: s?.paperNumber,
                  paperName: s?.paperName,
                  appearing: true,
                })),
              }
            : undefined,
        },
        status: 'published',
        issuedBy,
        metadata: {
          generatedAt: new Date(),
          generatedBy: issuedBy,
          version: '1.0',
        },
      });
    });

    return await HallTicket.create(tickets);
  }

  async listHallTickets(userRole: string, userId: string): Promise<IHallTicket[]> {
    const query: any = {};

    if (userRole === 'institute') {
      const institute = await Institute.findOne({ user: userId, status: 'Approved' });
      if (!institute) return [];
      query.institute = institute._id;
    }

    return await HallTicket.find(query)
      .populate('student', 'firstName lastName enrollmentId')
      .populate('issuedBy', 'name email')
      .sort({ createdAt: -1 });
  }

  async generateHallTicketPDF(hallTicketId: string, templateId?: string): Promise<Buffer> {
    const hallTicket = await HallTicket.findById(hallTicketId).populate('issuedBy');
    if (!hallTicket) {
      throw new Error('Hall ticket not found');
    }

    let template;
    if (templateId) {
      template = await HallTicketTemplate.findById(templateId);
    } else {
      // Get default template based on exam type
      template = await HallTicketTemplate.findOne({ 
        type: 'system', 
        isDefault: true 
      });
    }

    if (!template) {
      throw new Error('Template not found');
    }

    // Generate PDF using the template
    return await pdfGeneratorService.generateHallTicket(hallTicket, template);
  }

  async getHallTicketById(hallTicketId: string): Promise<IHallTicket | null> {
    return await HallTicket.findById(hallTicketId).populate('issuedBy');
  }

  async getHallTicketTemplate(templateId: string): Promise<any> {
    return await HallTicketTemplate.findById(templateId);
  }

  async createCustomTemplate(data: any): Promise<any> {
    const template = new HallTicketTemplate({
      ...data,
      version: 1,
      isActive: true
    });
    return await template.save();
  }

  async updateTemplate(templateId: string, data: any): Promise<any> {
    return await HallTicketTemplate.findByIdAndUpdate(
      templateId,
      { 
        ...data, 
        updatedAt: new Date(),
        $inc: { version: 1 }
      },
      { new: true }
    );
  }

  async getInstituteTemplates(instituteId: string): Promise<any[]> {
    return await HallTicketTemplate.find({
      $or: [
        { type: 'system' },
        { instituteId, type: 'institute' }
      ],
      isActive: true
    }).sort({ type: 1, name: 1 });
  }

  private generateHallTicketNumber(examType: string = 'CCT-EM'): string {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = new Date().getMonth() + 1;
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    const prefixes: { [key: string]: string } = {
      'CCT-EM': 'EM',
      'Basic Sciences': 'BS',
      'Final Year': 'FY',
      'Custom': 'CT'
    };
    
    const prefix = prefixes[examType] || 'CT';
    return `${prefix}${year}${month.toString().padStart(2, '0')}${random}`;
  }
}

export default new HallTicketService();