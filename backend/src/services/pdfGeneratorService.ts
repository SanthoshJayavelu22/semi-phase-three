let PDFDocument: any;
let sharp: any;
try { PDFDocument = require('pdfkit'); } catch {}
try { sharp = require('sharp'); } catch {}
import { IHallTicket } from '../models/hallTicketModel';

class PDFGeneratorService {
  async generateHallTicket(hallTicket: IHallTicket, template: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          layout: template.config.layout || 'portrait',
          size: template.config.pageSize || 'A4',
          margin: template.config.margins || { top: 40, bottom: 40, left: 40, right: 40 }
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: any) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Apply styles
        const styles = template.config.styles;
        doc.font(styles.fontFamily);
        doc.fontSize(styles.bodyFontSize);

        // Add watermark if enabled
        if (template.config.watermark?.enabled) {
          this.addWatermark(doc, template.config.watermark);
        }

        // Sort sections by order
        const sections = template.config.sections
          .filter((s: any) => s.enabled)
          .sort((a: any, b: any) => a.order - b.order);

        let yPosition = template.config.margins.top;

        sections.forEach((section: any) => {
          const content = this.generateSectionContent(section, hallTicket);
          const renderedContent = this.renderSection(doc, section, content, yPosition);
          yPosition += renderedContent.height + 20;
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private generateSectionContent(section: any, hallTicket: any): any {
    const dataMap: { [key: string]: any } = {
      'hallTicketNumber': hallTicket?.hallTicketNumber || hallTicket?.ticketId || '',
      'candidateName': hallTicket?.candidate?.name || hallTicket?.studentName || '',
      'candidateEnrollment': hallTicket?.candidate?.enrollmentId || hallTicket?.enrollmentId || '',
      'instituteName': hallTicket?.institute?.name || hallTicket?.instituteName || '',
      'programDirector': hallTicket?.institute?.programDirector || '',
      'examCentre': hallTicket?.examDetails?.theory?.centre || hallTicket?.examVenue || '',
      'examAddress': hallTicket?.examDetails?.theory?.address || '',
      'theorySubjects': hallTicket?.examDetails?.theory?.subjects || hallTicket?.subjects || [],
      'practicalDetails': hallTicket?.examDetails?.practical || null,
      'examTime': hallTicket?.examDetails?.theory?.timeSlot || '10am to 1pm',
      'practicalTime': hallTicket?.examDetails?.practical?.timeSlot || '8am to 5pm'
    };

    // Map fields to data
    const fields = section.fields || [];
    const content: any = {};

    fields.forEach((field: any) => {
      if (field.mapping && dataMap[field.mapping]) {
        content[field.id] = dataMap[field.mapping];
      }
    });

    // Add custom content
    if (section.content) {
      content.custom = section.content;
    }

    return content;
  }

  private renderSection(doc: any, section: any, content: any, yPosition: number): any {
    let height = 0;
    const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    switch (section.type) {
      case 'header':
        height = this.renderHeader(doc, section, content, yPosition, width);
        break;
      case 'candidate':
        height = this.renderCandidateSection(doc, section, content, yPosition, width);
        break;
      case 'exam':
        height = this.renderExamSection(doc, section, content, yPosition, width);
        break;
      case 'instructions':
        height = this.renderInstructions(doc, section, content, yPosition, width);
        break;
      case 'footer':
        height = this.renderFooter(doc, section, content, yPosition, width);
        break;
      default:
        height = this.renderCustomSection(doc, section, content, yPosition, width);
    }

    return { height };
  }

  private renderHeader(doc: any, section: any, content: any, y: number, width: number): number {
    const primaryColor = section.customStyles?.primaryColor || '#1a237e';
    
    doc.fillColor(primaryColor);
    doc.fontSize(16);
    doc.text(content.title || 'Society for Emergency Medicine India (SEMI)', 
              doc.page.margins.left, y, { align: 'center' });
    
    doc.fontSize(12);
    doc.text(content.subtitle || 'Hall Ticket', 
              doc.page.margins.left, y + 25, { align: 'center' });
    
    // Add horizontal line
    doc.strokeColor(primaryColor)
       .lineWidth(2)
       .moveTo(doc.page.margins.left, y + 45)
       .lineTo(doc.page.width - doc.page.margins.right, y + 45)
       .stroke();

    return 60;
  }

  private renderCandidateSection(doc: any, section: any, content: any, y: number, width: number): number {
    let currentY = y + 20;
    
    doc.fillColor('#000000');
    doc.fontSize(12);
    doc.text('Section I: Candidate Details', doc.page.margins.left, currentY, { 
      bold: true 
    });
    currentY += 20;

    // Candidate info box
    const boxHeight = 120;
    const boxWidth = width;
    doc.rect(doc.page.margins.left, currentY, boxWidth, boxHeight)
       .stroke();

    const margin = 10;
    let innerY = currentY + margin;

    // Name
    doc.fontSize(10);
    doc.text(`Name of the Candidate: ${content.candidateName || 'N/A'}`, 
             doc.page.margins.left + margin, innerY);
    innerY += 20;

    // Hall ticket number
    doc.text(`Hall ticket Number: ${content.hallTicketNumber || 'N/A'}`, 
             doc.page.margins.left + margin, innerY);
    innerY += 20;

    // Institute
    doc.text(`Name of the Enrolled Institute: ${content.instituteName || 'N/A'}`, 
             doc.page.margins.left + margin, innerY);
    innerY += 20;

    // Program Director
    doc.text(`Program Director: ${content.programDirector || 'N/A'}`, 
             doc.page.margins.left + margin, innerY);
    innerY += 20;

    // Candidate signature placeholder
    doc.text('Candidate\'s Signature:', 
             doc.page.margins.left + margin, innerY);
    doc.rect(doc.page.margins.left + 150, innerY, 100, 20)
       .stroke();

    // Program Director signature placeholder
    doc.text('Program Director\'s Signature & Institute\'s Seal:', 
             doc.page.margins.left + margin + 300, innerY);
    doc.rect(doc.page.margins.left + 500, innerY, 100, 20)
       .stroke();

    return boxHeight + 20;
  }

  private renderExamSection(doc: any, section: any, content: any, y: number, width: number): number {
    let currentY = y + 20;
    const primaryColor = section.customStyles?.primaryColor || '#1a237e';
    
    doc.fillColor(primaryColor);
    doc.fontSize(12);
    doc.text('Section II: Theory Examinations', doc.page.margins.left, currentY, { 
      bold: true 
    });
    currentY += 20;

    // Exam centre
    doc.fillColor('#000000');
    doc.fontSize(10);
    doc.text(`Time: ${content.examTime || '10am to 1pm'}`, 
             doc.page.margins.left, currentY);
    currentY += 15;

    doc.text(`Theory Centre - ${content.examCentre || 'N/A'}`, 
             doc.page.margins.left, currentY);
    doc.text(`${content.examAddress || ''}`, 
             doc.page.margins.left + 200, currentY);
    currentY += 20;

    // Subjects table
    const subjects = content.theorySubjects || [];
    if (subjects.length > 0) {
      // Table header
      const colWidths = [120, 200, 80, 120];
      let xPos = doc.page.margins.left;
      
      doc.rect(xPos, currentY, colWidths.reduce((a, b) => a + b, 0), 25)
         .fill(primaryColor)
         .fillColor('#ffffff');
      
      doc.text('Date', xPos + 5, currentY + 8);
      xPos += colWidths[0];
      
      doc.text('Subject', xPos + 5, currentY + 8);
      xPos += colWidths[1];
      
      doc.text('Appearing', xPos + 5, currentY + 8);
      xPos += colWidths[2];
      
      doc.text('Signature', xPos + 5, currentY + 8);
      
      currentY += 25;
      xPos = doc.page.margins.left;

      // Table rows
      subjects.forEach((subject: any, index: number) => {
        const rowHeight = 20;
        doc.rect(xPos, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight)
           .stroke();
        
        doc.fillColor('#000000');
        doc.fontSize(10);
        doc.text(new Date(subject.date).toLocaleDateString(), xPos + 5, currentY + 5);
        xPos += colWidths[0];
        
        doc.text(`${subject.paperName} ${subject.paperNumber ? `Paper ${subject.paperNumber}` : ''}`, 
                 xPos + 5, currentY + 5);
        xPos += colWidths[1];
        
        doc.text(subject.appearing ? 'Yes' : 'No', xPos + 5, currentY + 5);
        xPos += colWidths[2];
        
        // Signature placeholder
        doc.rect(xPos + 5, currentY + 2, 80, 15)
           .stroke();
        doc.text('Invigilator\'s', xPos + 10, currentY + 5);
        
        currentY += rowHeight;
        xPos = doc.page.margins.left;
      });
    }

    // Practical section
    const practical = content.practicalDetails;
    if (practical && practical.appearing) {
      currentY += 20;
      doc.fillColor(primaryColor);
      doc.fontSize(12);
      doc.text('Section III: Practical Examination', doc.page.margins.left, currentY, { 
        bold: true 
      });
      currentY += 20;

      doc.fillColor('#000000');
      doc.fontSize(10);
      doc.text(`Time: ${practical.timeSlot || '8am to 5pm'}`, 
               doc.page.margins.left, currentY);
      currentY += 15;

      doc.text(`Date: ${new Date(practical.date).toLocaleDateString()}`, 
               doc.page.margins.left, currentY);
      currentY += 15;

      doc.text(`Practical Centre: ${practical.centre || 'N/A'}`, 
               doc.page.margins.left, currentY);
      doc.text(`${practical.address || ''}`, doc.page.margins.left + 200, currentY);
      currentY += 15;

      doc.text('Centre Coordinator\'s Signature:', doc.page.margins.left, currentY);
      doc.rect(doc.page.margins.left + 200, currentY, 150, 20)
         .stroke();
      currentY += 25;
    }

    return currentY - y + 20;
  }

  private renderInstructions(doc: any, section: any, content: any, y: number, width: number): number {
    const primaryColor = section.customStyles?.primaryColor || '#c62828';
    let currentY = y + 20;
    
    doc.fillColor(primaryColor);
    doc.fontSize(10);
    doc.text('Section IV: Instructions', doc.page.margins.left, currentY, { 
      bold: true 
    });
    currentY += 15;

    const instructions = content.instructions || [
      '1. Theory exam reporting time 9am',
      '2. Theory examination hall closes by 9:30am, any candidate appearing after 9:30am shall not be allowed to write exam',
      '3. For Practical exam candidates should report in centre by 8am',
      '4. Hall ticket becomes valid only after attaching latest passport size photo on the top right corner and attested by program director with seal',
      '5. Failing to carry hall ticket to exam centre, disqualifies the candidate to give exam'
    ];

    doc.fillColor('#000000');
    instructions.forEach((instruction: string) => {
      doc.text(instruction, doc.page.margins.left + 10, currentY);
      currentY += 15;
    });

    return currentY - y + 10;
  }

  private renderFooter(doc: any, section: any, content: any, y: number, width: number): number {
    const footerY = doc.page.height - doc.page.margins.bottom - 30;
    
    // Add horizontal line
    doc.strokeColor('#1a237e')
       .lineWidth(1)
       .moveTo(doc.page.margins.left, footerY)
       .lineTo(doc.page.width - doc.page.margins.right, footerY)
       .stroke();

    doc.fontSize(10);
    doc.text(content.controllerName || 'Dr Sowjanya Patibandla', 
             doc.page.margins.left, footerY + 10);
    doc.text('Controller - Examinations, SEMI', 
             doc.page.margins.left, footerY + 25);

    return 50;
  }

  private renderCustomSection(doc: any, section: any, content: any, y: number, width: number): number {
    // Handle custom section rendering
    let currentY = y;
    
    if (section.content) {
      doc.text(section.content, doc.page.margins.left, currentY);
      currentY += 20;
    }

    // Render custom fields
    const fields = section.fields || [];
    fields.forEach((field: any) => {
      if (content[field.id]) {
        const value = content[field.id];
        doc.text(`${field.label}: ${value}`, 
                 doc.page.margins.left + field.position.x, 
                 currentY + field.position.y);
        currentY += field.position.height || 20;
      }
    });

    return currentY - y + 20;
  }

  private addWatermark(doc: any, watermark: any): void {
    const text = watermark.text || 'SEMI';
    const opacity = watermark.opacity || 0.1;
    
    doc.save();
    doc.opacity(opacity);
    doc.fontSize(60);
    doc.fillColor('#000000');
    
    if (watermark.position === 'diagonal') {
      doc.translate(doc.page.width / 2, doc.page.height / 2)
         .rotate(-45);
      doc.text(text, 0, 0, { align: 'center', width: doc.page.width });
    } else {
      doc.text(text, 0, 0, { 
        align: 'center', 
        width: doc.page.width,
        height: doc.page.height
      });
    }
    
    doc.restore();
  }

  async generateMarksheetPDF(_params: any): Promise<string> {
    return '';
  }

  async generateProvisionalCertificatePDF(_params: any): Promise<string> {
    return '';
  }
}

export default new PDFGeneratorService();