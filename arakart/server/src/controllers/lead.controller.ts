import { Request, Response } from 'express';
import { leadService } from '../services/lead.service';
import { createLeadSchema, updateLeadStatusSchema } from '../validators/lead.validators';
import { sendSuccess, sendError } from '../utils/responseHelper';

export const createLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Authentication required to initiate contact', 401);
      return;
    }

    const parseResult = createLeadSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, 'Invalid lead payload', 400, 'VALIDATION_ERROR', parseResult.error.errors);
      return;
    }

    const { providerId, type, service } = parseResult.data;
    const result = await leadService.createLead(userId, providerId, type, service);

    sendSuccess(res, result, 'Lead recorded successfully', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to create lead', error.statusCode || 500);
  }
};

export const getSellerLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const status = req.query.status as string | undefined;

    const result = await leadService.getSellerLeads(userId, page, limit, status);
    sendSuccess(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch seller leads', error.statusCode || 500);
  }
};

export const updateLeadStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { id } = req.params;
    const parseResult = updateLeadStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, 'Invalid status', 400, 'VALIDATION_ERROR', parseResult.error.errors);
      return;
    }

    const updated = await leadService.updateLeadStatus(id, userId, parseResult.data.status);
    sendSuccess(res, updated, 'Lead status updated successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update lead status', error.statusCode || 500);
  }
};
