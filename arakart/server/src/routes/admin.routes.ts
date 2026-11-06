import { Router } from 'express';
import {
  getDashboardStats,
  getPendingSellers,
  approveSeller,
  rejectSeller,
  getUsers,
  suspendUser,
  getReports,
  resolveReport,
  getActivityLog,
} from '../controllers/admin.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// All admin routes strictly require valid authentication and the 'admin' role
router.use(verifyToken, requireRole('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/sellers/pending', getPendingSellers);
router.post('/sellers/:id/approve', approveSeller);
router.post('/sellers/:id/reject', rejectSeller);
router.get('/users', getUsers);
router.patch('/users/:id/suspend', suspendUser);
router.get('/reports', getReports);
router.patch('/reports/:id', resolveReport);
router.get('/activity', getActivityLog);

export default router;
