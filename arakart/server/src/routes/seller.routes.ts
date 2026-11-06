import { Router } from 'express';
import {
  applySeller,
  getMyProfile,
  updateProfile,
  updateCatalogue,
  toggleLive,
  getStats,
} from '../controllers/seller.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Apply to become a seller (any authenticated user)
router.post('/apply', verifyToken, applySeller);

// Seller profile & dashboard routes
router.get('/me', verifyToken, requireRole('seller', 'admin'), getMyProfile);
router.put('/me/profile', verifyToken, requireRole('seller', 'admin'), updateProfile);
router.put('/me/catalogue', verifyToken, requireRole('seller', 'admin'), updateCatalogue);
router.put('/me/toggle-live', verifyToken, requireRole('seller', 'admin'), toggleLive);
router.get('/me/stats', verifyToken, requireRole('seller', 'admin'), getStats);

export default router;
