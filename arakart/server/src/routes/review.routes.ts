import { Router } from 'express';
import {
  createReview,
  getProviderReviews,
  replyToReview,
  deleteReview,
} from '../controllers/review.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Public: get reviews for a provider
router.get('/provider/:providerId', getProviderReviews);

// Customer: submit a review
router.post('/', verifyToken, createReview);

// Seller: reply to a review
router.patch('/:id/reply', verifyToken, requireRole('seller', 'admin'), replyToReview);

// Admin: delete a review
router.delete('/:id', verifyToken, requireRole('admin'), deleteReview);

export default router;
