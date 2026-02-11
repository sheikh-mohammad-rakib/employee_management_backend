const express = require('express');
const router = express.Router();
const {
    createTask,
    getTasks,
    updateTaskStatus,
    deleteTask,
    getTaskById,
} = require('../controllers/taskController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private (Employee/Admin/HR)
router.post('/', requireAuth, createTask);

// @route   GET /api/tasks
// @desc    Get tasks (employees see their own, admin/hr see all)
// @access  Private (Employee/Admin/HR)
router.get('/', requireAuth, getTasks);

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private (Employee/Admin/HR)
router.get('/:id', requireAuth, getTaskById);

// @route   PATCH /api/tasks/:id
// @desc    Update task status
// @access  Private (Employee/Admin/HR)
router.patch('/:id', requireAuth, updateTaskStatus);

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private (Admin/HR)
router.delete('/:id', requireAuth, requireAdmin, deleteTask);

module.exports = router;
