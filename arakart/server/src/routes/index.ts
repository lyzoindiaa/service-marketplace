import { Router } from 'express';
import { sendSuccess } from '../utils/responseHelper';
import authRoutes from './auth.routes';

const router = Router();

// Versioned health check
router.get('/health', (_req, res) => {
  sendSuccess(res, {
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Authentication routes
router.use('/auth', authRoutes);

export default router;
