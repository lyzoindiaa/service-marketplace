import { Request, Response } from 'express';
import { reportService } from '../services/report.service';
import { sendSuccess, sendError } from '../utils/responseHelper';

export const createReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { providerId, reason, details, description } = req.body;
    if (
      !providerId ||
      typeof providerId !== 'string' ||
      !reason ||
      typeof reason !== 'string'
    ) {
      sendError(res, 'Valid string providerId and reason are required', 400);
      return;
    }

    const noteDetails =
      typeof details === 'string'
        ? details
        : typeof description === 'string'
          ? description
          : undefined;

    const report = await reportService.createReport(userId, providerId, reason, noteDetails);
    sendSuccess(res, report, 'Report submitted successfully', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to submit report', error.statusCode || 500);
  }
};
