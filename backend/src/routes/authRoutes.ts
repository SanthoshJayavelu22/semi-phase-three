import express from 'express';
import {
  register,
  login,
  logout,
  logoutAllDevices,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  checkStatus,
} from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';
import { passwordResetLimiter } from '../middlewares/rateLimiter';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/logout-all', protect, logoutAllDevices);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.get('/status', protect, checkStatus);

export default router;

