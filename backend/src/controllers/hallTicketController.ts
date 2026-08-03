// backend/src/controllers/hallTicketController.ts
import { Request, Response } from 'express';
import hallTicketService from '../services/hallTicketService';
import { responseFormatter } from '../utils/responseFormatter';

export class HallTicketController {
  async createHallTicket(req: Request, res: Response): Promise<Response> {
    try {
      const hallTicket = await hallTicketService.createHallTicket({
        ...req.body,
        issuedBy: req.user._id
      });
      return responseFormatter.success(res, hallTicket, 'Hall ticket created successfully');
    } catch (error: any) {
      return responseFormatter.error(res, error.message, 400);
    }
  }

  async generatePDF(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { templateId } = req.query;
      
      const pdfBuffer = await hallTicketService.generateHallTicketPDF(id, templateId as string);
      
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
        instituteId: req.user.instituteId,
        type: 'institute'
      });
      return responseFormatter.success(res, template, 'Template created successfully');
    } catch (error: any) {
      return responseFormatter.error(res, error.message, 400);
    }
  }

  async getTemplates(req: Request, res: Response): Promise<Response> {
    try {
      const templates = await hallTicketService.getInstituteTemplates(req.user.instituteId);
      return responseFormatter.success(res, templates);
    } catch (error: any) {
      return responseFormatter.error(res, error.message, 400);
    }
  }

  async updateTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const template = await hallTicketService.updateTemplate(req.params.id, req.body);
      return responseFormatter.success(res, template, 'Template updated successfully');
    } catch (error: any) {
      return responseFormatter.error(res, error.message, 400);
    }
  }

  async getHallTicket(req: Request, res: Response): Promise<Response> {
    try {
      const hallTicket = await hallTicketService.getHallTicketById(req.params.id);
      if (!hallTicket) {
        return responseFormatter.error(res, 'Hall ticket not found', 404);
      }
      return responseFormatter.success(res, hallTicket);
    } catch (error: any) {
      return responseFormatter.error(res, error.message, 400);
    }
  }
}

export default new HallTicketController();