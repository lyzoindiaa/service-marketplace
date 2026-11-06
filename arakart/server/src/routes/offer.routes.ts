import { Router } from 'express';
import {
  getPublicOffers,
  getSellerOffers,
  createSellerOffer,
  updateSellerOffer,
  deleteSellerOffer,
  applyOffer,
  getMyAppliedOffers,
  getAdminOffers,
} from '../controllers/offer.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Public offers discovery
router.get('/', getPublicOffers);

// Customer applied offers
router.get('/my-applied', verifyToken, getMyAppliedOffers);
router.post('/:id/apply', verifyToken, applyOffer);

// Seller offer management
router.get('/seller', verifyToken, requireRole('seller', 'admin'), getSellerOffers);
router.post('/seller', verifyToken, requireRole('seller', 'admin'), createSellerOffer);
router.put('/seller/:id', verifyToken, requireRole('seller', 'admin'), updateSellerOffer);
router.delete('/seller/:id', verifyToken, requireRole('seller', 'admin'), deleteSellerOffer);

// Admin offers overview
router.get('/admin', verifyToken, requireRole('admin'), getAdminOffers);

export default router;
