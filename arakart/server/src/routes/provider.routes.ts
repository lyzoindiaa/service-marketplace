import { Router } from 'express';
import { getProviders, getProviderById, getPublicStats } from '../controllers/provider.controller';

const router = Router();

// Public provider discovery endpoints
router.get('/public-stats', getPublicStats);
router.get('/', getProviders);
router.get('/:id', getProviderById);

export default router;
