// backend/src/services/pdfGeneratorService.ts
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

export const streamPDFResponse = async (pdfBuffer: Buffer, res: any, filename: string) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', pdfBuffer.length);

  const readableStream = Readable.from(pdfBuffer);
  await pipeline(readableStream, res);
};

export const writePDFStreamToFile = async (pdfBuffer: Buffer, outputPath: string) => {
  const readableStream = Readable.from(pdfBuffer);
  const writeStream = fs.createWriteStream(outputPath);
  await pipeline(readableStream, writeStream);
};

export const generateMarksheetPDF = async (data: any): Promise<string> => {
  return `data:application/pdf;base64,${Buffer.from(`%PDF-1.4 Mock Marksheet PDF for ${data?.studentName || 'Student'}`).toString('base64')}`;
};

export const generateProvisionalCertificatePDF = async (data: any): Promise<string> => {
  return `data:application/pdf;base64,${Buffer.from(`%PDF-1.4 Mock Provisional Certificate PDF for ${data?.studentName || 'Student'}`).toString('base64')}`;
};

export const generateHallTicket = async (hallTicket: any, template: any): Promise<Buffer> => {
  return Buffer.from(`%PDF-1.4 Mock Hall Ticket PDF for ${hallTicket?.studentName || 'Student'}`);
};

const pdfGeneratorService = {
  streamPDFResponse,
  writePDFStreamToFile,
  generateMarksheetPDF,
  generateProvisionalCertificatePDF,
  generateHallTicket,
};

export default pdfGeneratorService;