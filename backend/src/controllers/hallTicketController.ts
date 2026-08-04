// backend/src/controllers/hallTicketController.ts
import { Request, Response } from 'express';
import hallTicketService from '../services/hallTicketService';
import { sendSuccess, sendError } from '../utils/responseFormatter';

export class HallTicketController {
  async createHallTicket(req: Request, res: Response): Promise<Response> {
    try {
      const hallTicket = await hallTicketService.createHallTicket({
        ...req.body,
        issuedBy: req.user?._id
      });
      return sendSuccess({ req, res, data: hallTicket, message: 'Hall ticket created successfully' });
    } catch (error: any) {
      return sendError({ req, res, message: error.message, statusCode: 400 });
    }
  }

  async generatePDF(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const templateId = typeof req.query.templateId === 'string' ? req.query.templateId : undefined;
      
      const pdfBuffer = await hallTicketService.generateHallTicketPDF(id as string, templateId);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=hall-ticket-${id}.pdf`);
      res.send(pdfBuffer);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async createCustomTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const template = await hallTicketService.createCustomTemplate({
        ...req.body,
        instituteId: req.user?.instituteId,
        type: 'institute'
      });
      return sendSuccess({ req, res, data: template, message: 'Template created successfully' });
    } catch (error: any) {
      return sendError({ req, res, message: error.message, statusCode: 400 });
    }
  }

  async getTemplates(req: Request, res: Response): Promise<Response> {
    try {
      const templates = await hallTicketService.getInstituteTemplates(req.user?.instituteId);
      return sendSuccess({ req, res, data: templates });
    } catch (error: any) {
      return sendError({ req, res, message: error.message, statusCode: 400 });
    }
  }

  async updateTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const template = await hallTicketService.updateTemplate(id, req.body);
      return sendSuccess({ req, res, data: template, message: 'Template updated successfully' });
    } catch (error: any) {
      return sendError({ req, res, message: error.message, statusCode: 400 });
    }
  }

  async getHallTicket(req: Request, res: Response): Promise<Response> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const hallTicket = await hallTicketService.getHallTicketById(id);
      if (!hallTicket) {
        return sendError({ req, res, message: 'Hall ticket not found', statusCode: 404 });
      }
      return sendSuccess({ req, res, data: hallTicket });
    } catch (error: any) {
      return sendError({ req, res, message: error.message, statusCode: 400 });
    }
  }
}

export default new HallTicketController();