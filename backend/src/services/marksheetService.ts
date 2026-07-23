import { Marksheet } from '../models/marksheetModel';
import { Result } from '../models/resultModel';

function generateRandomString(length = 8): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

class MarksheetService {
  async generateMarksheetNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const random = generateRandomString(8);
    const sequence = await this.getNextSequence();
    return `MS-${year}-${sequence}-${random}`;
  }

  async getNextSequence(): Promise<string> {
    const count = await Marksheet.countDocuments();
    return String(count + 1).padStart(6, '0');
  }

  async getMarksheetsWithPagination(query: any, options: any) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const [marksheets, total] = await Promise.all([
      Marksheet.find(query)
        .populate(options.populate || [])
        .sort(options.sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Marksheet.countDocuments(query),
    ]);

    return {
      marksheets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async bulkGenerate(resultIds: string[]) {
    const generated: any[] = [];

    for (const resultId of resultIds) {
      try {
        const result = await Result.findById(resultId).populate('student');
        if (!result) continue;

        const existing = await Marksheet.findOne({ result: resultId });
        if (existing) continue;

        const marksheetNumber = await this.generateMarksheetNumber();
        const pdfUrl = `/uploads/marksheets/${marksheetNumber}.pdf`;

        const marksheet = await Marksheet.create({
          student: (result.student as any)._id,
          academicYear: result.academicYear,
          semester: result.semester,
          result: resultId,
          marksheetNumber,
          marksheetPDF: pdfUrl,
          isFinal: true,
          generatedDate: new Date(),
        });

        generated.push(marksheet);
      } catch (error) {
        console.error(`Failed to generate marksheet for result ${resultId}:`, error);
      }
    }

    return generated;
  }
}

export default new MarksheetService();
