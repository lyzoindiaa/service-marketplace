import { Router } from 'express';
import {
  getBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
} from '../controllers/blog.controller';
import { verifyToken, optionalAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Public & optional-auth routes
router.get('/', optionalAuth, getBlogs);
router.get('/:slug', getBlogBySlug);

// Admin CRUD routes
router.post('/', verifyToken, requireRole('admin'), createBlog);
router.put('/:id', verifyToken, requireRole('admin'), updateBlog);
router.delete('/:id', verifyToken, requireRole('admin'), deleteBlog);

export default router;
