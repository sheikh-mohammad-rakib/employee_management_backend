const express = require('express');
const router = express.Router();
const {
    checkIn,
    checkOut,
    getMyAttendance,
    getAllAttendance,
    getTodayStatus,
} = require('../controllers/attendanceController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// @route   POST /api/attendance/check-in
// @desc    Employee check-in
// @access  Private (Employee)
router.post('/check-in', requireAuth, checkIn);

// @route   POST /api/attendance/check-out
// @desc    Employee check-out
// @access  Private (Employee)
router.post('/check-out', requireAuth, checkOut);

// @route   GET /api/attendance/today
// @desc    Get today's attendance status
// @access  Private (Employee)
router.get('/today', requireAuth, getTodayStatus);

// @route   GET /api/attendance/my-records
// @desc    Get employee's own attendance records
// @access  Private (Employee)
router.get('/my-records', requireAuth, getMyAttendance);

// @route   GET /api/attendance/all
// @desc    Get all attendance records
// @access  Private (Admin/HR)
router.get('/all', requireAuth, requireAdmin, getAllAttendance);

module.exports = router;
