import { Request, Response } from 'express';
import { offerService } from '../services/offer.service';
import { sendSuccess, sendError } from '../utils/responseHelper';

export const getPublicOffers = async (req: Request, res: Response): Promise<void> => {
  try {
    const city = typeof req.query.city === 'string' ? req.query.city : undefined;
    const providerId = typeof req.query.providerId === 'string' ? req.query.providerId : undefined;
    const sellerId = typeof req.query.sellerId === 'string' ? req.query.sellerId : undefined;
    const scheduleType =
      typeof req.query.scheduleType === 'string' ? req.query.scheduleType : undefined;
    const customerId = req.user?.userId;

    const offers = await offerService.listPublicOffers({
      city,
      providerId,
      sellerId,
      scheduleType,
      customerId,
    });
    sendSuccess(res, { offers });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch offers', error.statusCode || 500);
  }
};

export const getSellerOffers = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    const result = await offerService.getSellerOffers(userId);
    sendSuccess(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch seller offers', error.statusCode || 500);
  }
};

export const createSellerOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    const offer = await offerService.createSellerOffer(userId, req.body);
    sendSuccess(res, offer, 'Service offer created successfully', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to create offer', error.statusCode || 400);
  }
};

export const updateSellerOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role || 'customer';
    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    const offer = await offerService.updateSellerOffer(userId, role, req.params.id, req.body);
    sendSuccess(res, offer, 'Offer updated successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update offer', error.statusCode || 400);
  }
};

export const deleteSellerOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role || 'customer';
    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    await offerService.deleteOffer(userId, role, req.params.id);
    sendSuccess(res, { id: req.params.id }, 'Offer deleted successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to delete offer', error.statusCode || 400);
  }
};

export const applyOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Please sign in to apply this offer', 401);
      return;
    }
    const result = await offerService.applyOfferForCustomer(userId, req.params.id);
    sendSuccess(res, result, 'Offer applied successfully', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to apply offer', error.statusCode || 400);
  }
};

export const getMyAppliedOffers = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    const appliedOffers = await offerService.getCustomerAppliedOffers(userId);
    sendSuccess(res, { appliedOffers });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch applied offers', error.statusCode || 500);
  }
};

export const getAdminOffers = async (req: Request, res: Response): Promise<void> => {
  try {
    const city = typeof req.query.city === 'string' ? req.query.city : undefined;
    const scheduleType =
      typeof req.query.scheduleType === 'string' ? req.query.scheduleType : undefined;
    const offers = await offerService.getAllOffersForAdmin({ city, scheduleType });
    sendSuccess(res, { offers });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch admin offers', error.statusCode || 500);
  }
};
