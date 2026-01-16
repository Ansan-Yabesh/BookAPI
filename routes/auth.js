import express from 'express';
import {
  register,
  login,
  verifyOTP,
  resendOTP,
  approveUser,
  rejectUser,
  getUsers,
  getPendingUsers,
  updateProfile,
  createManager
} from '../controllers/authControllers.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Register & Login (No Auth Required)
router.post('/register', register);
router.post('/login', login);

// Create Manager (Admin only)
router.post('/create-manager', authenticate, authorize('admin'), createManager);

// OTP Verification (No Auth Required)
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

// Approve/Reject user (for manager/admin)
router.put('/approve/:userId', authenticate, authorize('manager', 'admin'), approveUser);
router.delete('/reject/:userId', authenticate, authorize('manager', 'admin'), rejectUser);

// Admin-only routes: list all users and pending users
router.get('/users', authenticate, authorize('admin'), getUsers);
router.get('/pending-users', authenticate, authorize('manager', 'admin'), getPendingUsers);

// User updates their own profile
router.put('/profile', authenticate, updateProfile);

export default router;
