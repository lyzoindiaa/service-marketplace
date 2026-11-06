import { Router } from 'express';
import { getProviders, getProviderById } from '../controllers/provider.controller';

const router = Router();

// Public provider discovery endpoints
router.get('/', getProviders);
router.get('/:id', getProviderById);

export default router;
