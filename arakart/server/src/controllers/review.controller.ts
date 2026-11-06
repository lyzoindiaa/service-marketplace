import { Request, Response } from 'express';
import { reviewService } from '../services/review.service';
import { createReviewSchema, replyReviewSchema } from '../validators/review.validators';
import { sendSuccess, sendError } from '../utils/responseHelper';

export const createReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Authentication required to post a review', 401);
      return;
    }

    const parseResult = createReviewSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, 'Invalid review payload', 400, 'VALIDATION_ERROR', parseResult.error.errors);
      return;
    }

    const { providerId, rating, comment } = parseResult.data;
    const result = await reviewService.createReview(userId, providerId, rating, comment);

    sendSuccess(res, result, 'Review submitted successfully', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to submit review', error.statusCode || 500);
  }
};

export const getProviderReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { providerId } = req.params;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const result = await reviewService.getProviderReviews(providerId, page, limit);
    sendSuccess(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch provider reviews', error.statusCode || 500);
  }
};

export const replyToReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId || !userRole) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { id } = req.params;
    const parseResult = replyReviewSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, 'Invalid reply payload', 400, 'VALIDATION_ERROR', parseResult.error.errors);
      return;
    }

    const { reply } = parseResult.data;
    const result = await reviewService.addReply(id, userId, userRole, reply);

    sendSuccess(res, result, 'Reply added successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to reply to review', error.statusCode || 500);
  }
};

export const deleteReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await reviewService.deleteReview(id);

    sendSuccess(res, null, 'Review deleted successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to delete review', error.statusCode || 500);
  }
};
