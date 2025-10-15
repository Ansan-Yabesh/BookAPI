const express = require('express');
const { register, login, approveUser, getUsers } = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.put('/approve/:userId', authenticate, authorize('manager'), approveUser);
router.get('/users', authenticate, authorize('admin'), getUsers);

module.exports = router;
