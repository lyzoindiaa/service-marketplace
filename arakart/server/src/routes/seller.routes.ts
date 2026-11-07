import { Router } from 'express';
import {
  applySeller,
  getMyProfile,
  updateProfile,
  updateCatalogue,
  toggleLive,
  getStats,
  uploadPhoto,
  deletePhoto,
} from '../controllers/seller.controller';
import { verifyToken, optionalAuth, requireRole } from '../middleware/auth.middleware';
import { uploadSinglePhoto } from '../middleware/upload.middleware';

const router = Router();

// Apply to become a seller (open to all applicants; creates or links account)
router.post('/apply', optionalAuth, applySeller);

// Seller profile & dashboard routes
router.get('/me', verifyToken, requireRole('seller', 'admin'), getMyProfile);
router.put('/me/profile', verifyToken, requireRole('seller', 'admin'), updateProfile);
router.put('/me/catalogue', verifyToken, requireRole('seller', 'admin'), updateCatalogue);
router.put('/me/toggle-live', verifyToken, requireRole('seller', 'admin'), toggleLive);
router.get('/me/stats', verifyToken, requireRole('seller', 'admin'), getStats);
router.post('/me/photos', verifyToken, requireRole('seller', 'admin'), uploadSinglePhoto('photo'), uploadPhoto);
router.delete('/me/photos', verifyToken, requireRole('seller', 'admin'), deletePhoto);

export default router;
