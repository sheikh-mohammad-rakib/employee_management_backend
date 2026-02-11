const { query } = require('../config/database');

/**
 * Create a task
 */
const createTask = async (req, res) => {
    try {
        const { title, description, dueDate, assignedTo } = req.body;
        const createdBy = req.user.id;
        const userRole = req.user.role;

        // Validate input
        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a task title',
            });
        }

        // Determine assigned user and initial status
        let assignee = assignedTo || createdBy;
        let status = 'In Progress'; // Default for employee-created tasks

        // If admin/hr is creating and assigning to someone else, set status to "To Do"
        if ((userRole === 'admin' || userRole === 'hr') && assignedTo && assignedTo !== createdBy) {
            status = 'To Do';
        }

        // Verify assigned user exists
        const userCheck = await query('SELECT id FROM users WHERE id = $1', [assignee]);

        if (userCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Assigned user not found',
            });
        }

        // Create task
        const result = await query(
            'INSERT INTO tasks (title, description, due_date, status, assigned_to, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [title, description, dueDate, status, assignee, createdBy]
        );

        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            data: {
                task: result.rows[0],
            },
        });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating task',
            error: error.message,
        });
    }
};

/**
 * Get tasks (role-based filtering)
 */
const getTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const { status, assignedTo } = req.query;

        let queryText = `
      SELECT t.*, 
             u1.name as assigned_to_name, u1.email as assigned_to_email,
             u2.name as created_by_name, u2.email as created_by_email
      FROM tasks t
      JOIN users u1 ON t.assigned_to = u1.id
      JOIN users u2 ON t.created_by = u2.id
    `;
        const params = [];
        const conditions = [];

        // Employees can only see their own tasks
        if (userRole === 'employee') {
            params.push(userId);
            conditions.push(`t.assigned_to = $${params.length}`);
        }

        // Admin/HR can filter by assignee
        if ((userRole === 'admin' || userRole === 'hr') && assignedTo) {
            params.push(assignedTo);
            conditions.push(`t.assigned_to = $${params.length}`);
        }

        // Filter by status
        if (status) {
            params.push(status);
            conditions.push(`t.status = $${params.length}`);
        }

        if (conditions.length > 0) {
            queryText += ' WHERE ' + conditions.join(' AND ');
        }

        queryText += ' ORDER BY t.created_at DESC';

        const result = await query(queryText, params);

        res.status(200).json({
            success: true,
            data: {
                tasks: result.rows,
                count: result.rows.length,
            },
        });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tasks',
            error: error.message,
        });
    }
};

/**
 * Update task status
 */
const updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Validate status
        if (!['To Do', 'In Progress', 'Done'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be "To Do", "In Progress", or "Done"',
            });
        }

        // Get task
        const taskResult = await query('SELECT * FROM tasks WHERE id = $1', [id]);

        if (taskResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        const task = taskResult.rows[0];

        // Check authorization
        // Employees can only update their own tasks
        if (userRole === 'employee' && task.assigned_to !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own tasks',
            });
        }

        // Update task status
        const result = await query(
            'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, id]
        );

        res.status(200).json({
            success: true,
            message: 'Task status updated successfully',
            data: {
                task: result.rows[0],
            },
        });
    } catch (error) {
        console.error('Update task status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating task status',
            error: error.message,
        });
    }
};

/**
 * Delete task (Admin/HR only)
 */
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if task exists
        const taskResult = await query('SELECT * FROM tasks WHERE id = $1', [id]);

        if (taskResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        // Delete task
        await query('DELETE FROM tasks WHERE id = $1', [id]);

        res.status(200).json({
            success: true,
            message: 'Task deleted successfully',
        });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting task',
            error: error.message,
        });
    }
};

/**
 * Get task by ID
 */
const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const result = await query(
            `SELECT t.*, 
              u1.name as assigned_to_name, u1.email as assigned_to_email,
              u2.name as created_by_name, u2.email as created_by_email
       FROM tasks t
       JOIN users u1 ON t.assigned_to = u1.id
       JOIN users u2 ON t.created_by = u2.id
       WHERE t.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        const task = result.rows[0];

        // Check authorization
        if (userRole === 'employee' && task.assigned_to !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only view your own tasks',
            });
        }

        res.status(200).json({
            success: true,
            data: {
                task: task,
            },
        });
    } catch (error) {
        console.error('Get task by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching task',
            error: error.message,
        });
    }
};

module.exports = {
    createTask,
    getTasks,
    updateTaskStatus,
    deleteTask,
    getTaskById,
};
