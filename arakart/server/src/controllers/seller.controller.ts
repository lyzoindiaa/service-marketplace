import { Request, Response } from 'express';
import { sellerService } from '../services/seller.service';
import {
  applySellerSchema,
  updateProfileSchema,
  updateCatalogueSchema,
} from '../validators/seller.validators';
import { sendSuccess, sendError } from '../utils/responseHelper';

export const applySeller = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Authentication required to register as seller', 401);
      return;
    }

    const parseResult = applySellerSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, 'Invalid seller application data', 400, 'VALIDATION_ERROR', parseResult.error.errors);
      return;
    }

    const provider = await sellerService.applyAsSeller(userId, parseResult.data);
    sendSuccess(res, provider, 'Seller application submitted successfully', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to submit seller application', error.statusCode || 500);
  }
};

export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const profile = await sellerService.getMyProfile(userId);
    sendSuccess(res, profile);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch seller profile', error.statusCode || 500);
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const parseResult = updateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, 'Invalid profile data', 400, 'VALIDATION_ERROR', parseResult.error.errors);
      return;
    }

    const profile = await sellerService.updateProfile(userId, parseResult.data);
    sendSuccess(res, profile, 'Profile updated successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update profile', error.statusCode || 500);
  }
};

export const updateCatalogue = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const parseResult = updateCatalogueSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, 'Invalid catalogue data', 400, 'VALIDATION_ERROR', parseResult.error.errors);
      return;
    }

    const profile = await sellerService.updateCatalogue(userId, parseResult.data.services);
    sendSuccess(res, profile, 'Catalogue updated successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update catalogue', error.statusCode || 500);
  }
};

export const toggleLive = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const profile = await sellerService.toggleLive(userId);
    sendSuccess(res, profile, 'Live status updated successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to toggle live status', error.statusCode || 500);
  }
};

export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const stats = await sellerService.getStats(userId);
    sendSuccess(res, stats);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch seller statistics', error.statusCode || 500);
  }
};
