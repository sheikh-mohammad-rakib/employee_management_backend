const express = require('express');
const router = express.Router();
const { getAllUsers, getUserProfile } = require('../controllers/userController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', requireAuth, getUserProfile);

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin/HR)
router.get('/', requireAuth, requireAdmin, getAllUsers);

module.exports = router;
