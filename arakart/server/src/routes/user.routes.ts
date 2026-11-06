import { Router } from 'express';
import {
  getMyFavourites,
  addMyFavourite,
  removeMyFavourite,
} from '../controllers/user.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// Protected user routes
router.get('/me/favourites', verifyToken, getMyFavourites);
router.post('/me/favourites/:providerId', verifyToken, addMyFavourite);
router.delete('/me/favourites/:providerId', verifyToken, removeMyFavourite);

export default router;
