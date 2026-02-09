import { Router } from 'express';
import { getLoginHistory, getRecentFailedLogins } from '../controllers/loginHistoryController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user's login history
router.get('/', getLoginHistory);

// Get recent failed login attempts
router.get('/failed', getRecentFailedLogins);

export default router;
