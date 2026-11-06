import { Router } from 'express';
import {
  getCategories,
  createCategory,
  toggleCategory,
} from '../controllers/category.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Public: list enabled categories
router.get('/', getCategories);

// Admin-only operations
router.post('/', verifyToken, requireRole('admin'), createCategory);
router.patch('/:id/toggle', verifyToken, requireRole('admin'), toggleCategory);

export default router;
