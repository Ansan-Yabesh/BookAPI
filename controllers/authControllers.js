const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const register = [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { username, email, password, role } = req.body;

      // Only admin can create managers
      if (role === 'manager' && (!req.user || req.user.role !== 'admin')) {
        return res.status(403).json({ message: 'Only admin can create managers.' });
      }

      const user = new User({ username, email, password, role });
      await user.save();
      res.status(201).json({ message: 'User registered successfully. Awaiting approval.' });
    } catch (error) {
      if (error.code === 11000) res.status(400).json({ message: 'Username or email already exists.' });
      else res.status(500).json({ message: 'Server error.' });
    }
  }
];

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    if (user.status !== 'approved') {
      return res.status(403).json({ message: 'Account not approved yet.' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.status = 'approved';
    await user.save();
    res.json({ message: 'User approved successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { register, login, approveUser, getUsers };
