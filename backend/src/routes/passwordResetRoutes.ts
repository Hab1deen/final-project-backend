import { Router } from 'express';
import { requestPasswordReset, verifyResetToken, resetPassword } from '../controllers/passwordResetController';

const router = Router();

// Public route - request password reset
router.post('/request', requestPasswordReset);

// Public route - verify reset token
router.get('/verify/:token', verifyResetToken);

// Public route - reset password with token
router.post('/reset', resetPassword);

export default router;
