import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { sendOTP, sendApprovalEmail, sendRejectionEmail } from '../lib/email.js';

// Utility: Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Register: Creates user with email verification pending
 * Sends OTP to user's email
 * Only users register publicly. Managers are created by admin through createManager endpoint.
 */
const register = [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { username, email, password } = req.body;
      // Public registration is only for 'user' role
      const role = 'user';

      // Check if email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered.' });
      }

      // Generate OTP (6 digits)
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

      // Create user with emailVerified = false, status = pending
      const user = new User({
        username,
        email,
        password,
        role,
        status: 'pending',
        emailVerified: false,
        otp,
        otpExpiry
      });

      await user.save();

      // Send OTP to email
      try {
        await sendOTP(email, otp);
      } catch (emailError) {
        // If email fails, still allow registration but user must request OTP resend
        console.error('OTP email send failed:', emailError.message);
      }

      res.status(201).json({
        message: 'User registered successfully. An OTP has been sent to your email. Please verify your email before your account can be approved.',
        userId: user._id,
        email: user.email
      });
    } catch (error) {
      console.error('Register error:', error.message);
      if (error.code === 11000) {
        res.status(400).json({ message: 'Username or email already exists.' });
      } else {
        res.status(500).json({ message: 'Server error.', error: error.message });
      }
    }
  }
];

/**
 * Verify OTP: User verifies the OTP sent to their email
 * Marks email as verified and status changes to pending admin approval
 */
const verifyOTP = [
  body('email').isEmail().withMessage('Invalid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { email, otp } = req.body;

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      // Check if already verified
      if (user.emailVerified) {
        return res.status(400).json({ message: 'Email already verified.' });
      }

      // Check if OTP exists
      if (!user.otp) {
        return res.status(400).json({ message: 'No OTP found. Please register again.' });
      }

      // Check if OTP has expired
      if (new Date() > user.otpExpiry) {
        return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
      }

      // Check if OTP matches
      if (user.otp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
      }

      // Mark email as verified
      user.emailVerified = true;
      user.verifiedAt = new Date();
      user.otp = null; // Clear OTP
      user.otpExpiry = null;
      await user.save();

      res.json({
        message: 'Email verified successfully. Your account is now pending approval.',
        userId: user._id,
        emailVerified: user.emailVerified
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  }
];

/**
 * Resend OTP: User can request a new OTP if expired
 */
const resendOTP = [
  body('email').isEmail().withMessage('Invalid email'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: 'Email already verified.' });
      }

      // Generate new OTP
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();

      // Send OTP to email
      try {
        await sendOTP(email, otp);
      } catch (emailError) {
        console.error('OTP resend failed:', emailError.message);
        return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
      }

      res.json({ message: 'New OTP sent to your email.' });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  }
];

/**
 * Login: User must have verified email AND approved status
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Check email verification
    if (!user.emailVerified) {
      return res.status(403).json({
        message: 'Email not verified. Please verify your email first.',
        userId: user._id
      });
    }

    // Check approval status
    if (user.status !== 'approved') {
      return res.status(403).json({ message: 'Account not approved yet.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: { id: user._id, username: user.username, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Approve User: Admin/Manager approves a verified user
 */
const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check email verification before approval
    if (!user.emailVerified) {
      return res.status(400).json({ message: 'User email must be verified before approval.' });
    }

    user.status = 'approved';
    await user.save();

    // Send approval email
    try {
      await sendApprovalEmail(user.email, user.username);
    } catch (emailError) {
      console.error('Approval email send failed:', emailError.message);
    }

    res.json({ message: 'User approved successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Reject User: Admin/Manager can reject a pending user
 */
const rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Delete user or mark as rejected
    await User.findByIdAndDelete(userId);

    // Send rejection email
    try {
      await sendRejectionEmail(user.email, user.username, reason || 'Your account was rejected.');
    } catch (emailError) {
      console.error('Rejection email send failed:', emailError.message);
    }

    res.json({ message: 'User rejected and deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Get All Users: Admin only
 */
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -otp');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Get Pending Users: Users awaiting approval
 */
const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ status: 'pending', emailVerified: true }).select('-password -otp');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Update Profile: User updates their own profile
 */
const updateProfile = [
  body('username').optional().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { username, email, password } = req.body;
      const userId = req.user._id;

      // Check for uniqueness if updating username or email
      if (username) {
        const existingUsername = await User.findOne({ username, _id: { $ne: userId } });
        if (existingUsername) return res.status(400).json({ message: 'Username already exists.' });
      }
      if (email) {
        const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
        if (existingEmail) return res.status(400).json({ message: 'Email already exists.' });
      }

      const updateData = {};
      if (username) updateData.username = username;
      if (email) updateData.email = email;
      if (password) updateData.password = password;

      const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
      if (!user) return res.status(404).json({ message: 'User not found.' });

      res.json({ message: 'Profile updated successfully.', user });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  }
];

/**
 * Create Manager: Only admin can create manager accounts
 * Managers go through OTP verification and admin approval
 */
const createManager = [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      // Only admin can create managers (req.user is set by authenticate middleware)
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only the admin can create manager accounts.' });
      }

      const { username, email, password } = req.body;

      // Check if email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered.' });
      }

      // Create manager as immediately verified and approved
      // Managers created by the admin do not require OTP or further approval
      const manager = new User({
        username,
        email,
        password,
        role: 'manager',
        status: 'approved',
        emailVerified: true,
        verifiedAt: new Date()
      });

      await manager.save();

      res.status(201).json({
        message: 'Manager account created and ready to login.',
        managerId: manager._id,
        email: manager.email
      });
    } catch (error) {
      console.error('Create manager error:', error.message);
      if (error.code === 11000) {
        res.status(400).json({ message: 'Username or email already exists.' });
      } else {
        res.status(500).json({ message: 'Server error.', error: error.message });
      }
    }
  }
];

export {
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
};
