import { Router } from 'express';
import {
  getCities,
  getCityAreas,
  createCity,
  toggleCity,
} from '../controllers/city.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Public discovery endpoints
router.get('/', getCities);
router.get('/:slug/areas', getCityAreas);

// Admin-only operations
router.post('/', verifyToken, requireRole('admin'), createCity);
router.patch('/:id/toggle', verifyToken, requireRole('admin'), toggleCity);

export default router;
