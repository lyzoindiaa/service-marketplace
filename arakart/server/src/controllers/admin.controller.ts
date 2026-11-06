import { Request, Response } from 'express';
import { adminService } from '../services/admin.service';
import { sendSuccess, sendError } from '../utils/responseHelper';

export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await adminService.getDashboardStats();
    sendSuccess(res, stats);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch dashboard stats', error.statusCode || 500);
  }
};

export const getPendingSellers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await adminService.getPendingSellers(page, limit);
    sendSuccess(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch pending sellers', error.statusCode || 500);
  }
};

export const approveSeller = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updated = await adminService.approveSeller(id);
    sendSuccess(res, updated, 'Seller approved successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to approve seller', error.statusCode || 500);
  }
};

export const rejectSeller = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const updated = await adminService.rejectSeller(id, reason);
    sendSuccess(res, updated, 'Seller rejected successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to reject seller', error.statusCode || 500);
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const role = req.query.role as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await adminService.getUsers({ page, limit, role, search });
    sendSuccess(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch users', error.statusCode || 500);
  }
};

export const suspendUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { suspended, isSuspended } = req.body;
    const shouldSuspend = typeof suspended === 'boolean' ? suspended : isSuspended;

    if (typeof shouldSuspend !== 'boolean') {
      sendError(res, 'suspended boolean flag is required', 400);
      return;
    }

    const updated = await adminService.suspendUser(id, shouldSuspend);
    sendSuccess(res, updated, `User ${shouldSuspend ? 'suspended' : 're-activated'} successfully`);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update user suspension status', error.statusCode || 500);
  }
};

export const getReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const result = await adminService.getReports(status, page, limit);
    sendSuccess(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch reports', error.statusCode || 500);
  }
};

export const resolveReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, adminNote, resolutionNote } = req.body;
    const note = adminNote || resolutionNote;

    if (!['resolved', 'dismissed'].includes(status)) {
      sendError(res, 'Status must be resolved or dismissed', 400);
      return;
    }

    const updated = await adminService.resolveReport(id, status, note);
    sendSuccess(res, updated, 'Report updated successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update report', error.statusCode || 500);
  }
};

export const getActivityLog = async (_req: Request, res: Response): Promise<void> => {
  try {
    const activity = await adminService.getActivityLog();
    sendSuccess(res, { activity });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch activity log', error.statusCode || 500);
  }
};
