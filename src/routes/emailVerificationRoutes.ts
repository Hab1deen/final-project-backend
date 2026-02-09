import { Router } from 'express';
import { sendVerificationEmail, verifyEmail, resendVerificationEmail } from '../controllers/emailVerificationController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// Protected route - send verification email to logged-in user
router.post('/send', authenticate, sendVerificationEmail);

// Public route - verify email with token
router.post('/verify', verifyEmail);

// Public route - resend verification email
router.post('/resend', resendVerificationEmail);

export default router;
