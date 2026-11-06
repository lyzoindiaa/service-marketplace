import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { sendSuccess, sendError } from '../utils/responseHelper';

export const getMyFavourites = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const favourites = await userService.getFavourites(userId);
    sendSuccess(res, favourites);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch favourites', error.statusCode || 500);
  }
};

export const addMyFavourite = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { providerId } = req.params;
    const favourites = await userService.addFavourite(userId, providerId);
    sendSuccess(res, { favourites, message: 'Provider added to favourites' });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to add favourite', error.statusCode || 500);
  }
};

export const removeMyFavourite = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { providerId } = req.params;
    const favourites = await userService.removeFavourite(userId, providerId);
    sendSuccess(res, { favourites, message: 'Provider removed from favourites' });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to remove favourite', error.statusCode || 500);
  }
};
