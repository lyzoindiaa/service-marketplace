import { Router } from 'express';
import { createLead, getSellerLeads, updateLeadStatus } from '../controllers/lead.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Create lead on click (all authenticated users: customer, seller, admin)
router.post('/', verifyToken, createLead);

// Seller lead management
router.get('/seller', verifyToken, requireRole('seller', 'admin'), getSellerLeads);
router.patch('/:id/status', verifyToken, requireRole('seller', 'admin'), updateLeadStatus);

export default router;
