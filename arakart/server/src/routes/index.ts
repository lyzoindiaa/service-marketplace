import { Router } from 'express';
import { sendSuccess } from '../utils/responseHelper';
import authRoutes from './auth.routes';
import categoryRoutes from './category.routes';
import cityRoutes from './city.routes';
import providerRoutes from './provider.routes';
import userRoutes from './user.routes';
import reportRoutes from './report.routes';
import leadRoutes from './lead.routes';
import reviewRoutes from './review.routes';
import sellerRoutes from './seller.routes';
import adminRoutes from './admin.routes';
import blogRoutes from './blog.routes';
import offerRoutes from './offer.routes';

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

// Discovery routes
router.use('/categories', categoryRoutes);
router.use('/cities', cityRoutes);
router.use('/providers', providerRoutes);

// User and reporting routes
router.use('/users', userRoutes);
router.use('/reports', reportRoutes);

// Leads routes
router.use('/leads', leadRoutes);

// Reviews routes
router.use('/reviews', reviewRoutes);

// Seller portal routes
router.use('/sellers', sellerRoutes);

// Admin portal routes
router.use('/admin', highValueAdminRoutes(adminRoutes));

// Dynamic Blogs & Service Offers routes
router.use('/blogs', blogRoutes);
router.use('/offers', offerRoutes);

function highValueAdminRoutes(r: Router) {
  return r;
}

export default router;
