import { Router } from 'express';
import { getProviders, getProviderById, getPublicStats } from '../controllers/provider.controller';
import { optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// Public provider discovery endpoints
router.get('/public-stats', getPublicStats);
router.get('/', getProviders);
router.get('/:id', optionalAuth, getProviderById);

export default router;
