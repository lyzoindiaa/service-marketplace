import { Router } from 'express';
import { createReport } from '../controllers/report.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// Protected report submission endpoint
router.post('/', verifyToken, createReport);

export default router;
