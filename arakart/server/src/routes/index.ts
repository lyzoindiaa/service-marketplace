import { Router } from 'express';
import { sendSuccess } from '../utils/responseHelper';

const router = Router();

// Versioned health check
router.get('/health', (_req, res) => {
  sendSuccess(res, {
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

export default router;
