import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import * as XLSX from 'xlsx';

export interface ParsedSubject {
  subjectCode: string;
  subjectName: string;
  internalMarks: number;
  externalMarks: number;
  credits: number;
}

export interface ParsedResultData {
  studentId: string;
  academicYear: string;
  semester: number;
  subjects: ParsedSubject[];
}

class FileParserService {
  async parseDocx(buffer: Buffer): Promise<ParsedResultData[]> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value;
      return this.parseTextToResults(text);
    } catch (error: any) {
      throw new Error(`Failed to parse DOCX: ${error.message}`);
    }
  }

  async parsePdf(buffer: Buffer): Promise<ParsedResultData[]> {
    try {
      const data = await pdfParse(buffer);
      return this.parseTextToResults(data.text);
    } catch (error: any) {
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }

  async parseExcel(buffer: Buffer): Promise<ParsedResultData[]> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      return this.parseExcelToResults(jsonData);
    } catch (error: any) {
      throw new Error(`Failed to parse Excel: ${error.message}`);
    }
  }

  private parseTextToResults(text: string): ParsedResultData[] {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const results: ParsedResultData[] = [];
    let currentStudent: Partial<ParsedResultData> = {};
    let isParsingSubjects = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.match(/^(Student|Candidate|Name|ID|Enrollment):/i)) {
        if (currentStudent.studentId && currentStudent.subjects?.length) {
          results.push(currentStudent as ParsedResultData);
        }
        currentStudent = { subjects: [] };
        isParsingSubjects = false;

        const parts = line.split(/[:,]\s*/);
        if (parts.length === 2) {
          const key = parts[0].toLowerCase();
          const value = parts[1];
          if (key.includes('id') || key.includes('enrollment')) {
            currentStudent.studentId = value;
          }
        }
        continue;
      }

      if (line.match(/^(Academic Year|Year|Semester):/i)) {
        const parts = line.split(/[:,]\s*/);
        if (parts.length === 2) {
          const key = parts[0].toLowerCase();
          const value = parts[1];
          if (key.includes('year')) {
            currentStudent.academicYear = value;
          } else if (key.includes('semester')) {
            currentStudent.semester = parseInt(value) || 1;
          }
        }
        continue;
      }

      if (line.match(/(Subject|Code|Marks|Internal|External|Credits)/i)) {
        isParsingSubjects = true;
        if (!currentStudent.subjects) currentStudent.subjects = [];
        continue;
      }

      if (isParsingSubjects && currentStudent.subjects) {
        const row = line.split(/\s{2,}|\t/).map(cell => cell.trim());
        if (row.length >= 3) {
          let subjectCode = row[0] || `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          let subjectName = row[1] || row[0] || 'Unknown Subject';
          let internalMarks = 0;
          let externalMarks = 0;
          let credits = 1;

          const numericValues = row.filter(cell => /^\d+(\.\d+)?$/.test(cell)).map(Number);
          if (numericValues.length >= 2) {
            internalMarks = numericValues[0] || 0;
            externalMarks = numericValues[1] || 0;
            if (numericValues.length >= 3) {
              credits = numericValues[2] || 1;
            }
          } else if (numericValues.length === 1) {
            internalMarks = numericValues[0] || 0;
            externalMarks = 0;
          }

          if (/^\d{1,2}\/\d{1,2}/.test(subjectCode) || subjectCode.length < 2) {
            subjectCode = `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          }

          if (/^\d+$/.test(subjectName) && row.length > 2) {
            subjectName = row[2] || row[0] || 'Unknown Subject';
          }

          currentStudent.subjects.push({
            subjectCode,
            subjectName,
            internalMarks,
            externalMarks,
            credits: Math.max(1, Math.min(6, credits)),
          });
        }
      }
    }

    if (currentStudent.studentId && currentStudent.subjects?.length) {
      results.push(currentStudent as ParsedResultData);
    }

    return results;
  }

  private parseExcelToResults(jsonData: any[]): ParsedResultData[] {
    const results: ParsedResultData[] = [];

    if (jsonData.length === 0) return results;

    const studentGroups = new Map<string, any[]>();

    for (const row of jsonData) {
      const studentId = row['Student ID'] || row['Enrollment ID'] || row['ID'] || row['Student'] || row['Enrollment'];
      if (studentId) {
        const key = String(studentId);
        if (!studentGroups.has(key)) {
          studentGroups.set(key, []);
        }
        studentGroups.get(key)!.push(row);
      }
    }

    for (const [studentId, rows] of studentGroups) {
      const firstRow = rows[0];
      const studentData: ParsedResultData = {
        studentId: String(studentId),
        academicYear: firstRow['Academic Year'] || firstRow['Year'] || '2024-25',
        semester: parseInt(firstRow['Semester']) || 1,
        subjects: [],
      };

      for (const row of rows) {
        const subjectCode = row['Subject Code'] || row['Code'] || `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const subjectName = row['Subject Name'] || row['Subject'] || 'Unknown Subject';

        studentData.subjects.push({
          subjectCode: String(subjectCode),
          subjectName: String(subjectName),
          internalMarks: parseFloat(row['Internal Marks']) || 0,
          externalMarks: parseFloat(row['External Marks']) || 0,
          credits: parseInt(row['Credits']) || 1,
        });
      }

      if (studentData.subjects.length > 0) {
        results.push(studentData);
      }
    }

    return results;
  }
}

export default new FileParserService();
