const express = require('express');
const router = express.Router();
const {
    createLeaveRequest,
    getMyLeaveRequests,
    getAllLeaveRequests,
    updateLeaveStatus,
} = require('../controllers/leaveController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// @route   POST /api/leaves
// @desc    Create a leave request
// @access  Private (Employee)
router.post('/', requireAuth, createLeaveRequest);

// @route   GET /api/leaves/my-requests
// @desc    Get employee's own leave requests
// @access  Private (Employee)
router.get('/my-requests', requireAuth, getMyLeaveRequests);

// @route   GET /api/leaves/all
// @desc    Get all leave requests
// @access  Private (Admin/HR)
router.get('/all', requireAuth, requireAdmin, getAllLeaveRequests);

// @route   PATCH /api/leaves/:id/status
// @desc    Update leave request status
// @access  Private (Admin/HR)
router.patch('/:id/status', requireAuth, requireAdmin, updateLeaveStatus);

module.exports = router;
