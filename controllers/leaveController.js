const { query } = require('../config/database');

/**
 * Create a leave request
 */
const createLeaveRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate, reason } = req.body;

        // Validate input
        if (!startDate || !endDate || !reason) {
            return res.status(400).json({
                success: false,
                message: 'Please provide startDate, endDate, and reason',
            });
        }

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            return res.status(400).json({
                success: false,
                message: 'Start date must be before or equal to end date',
            });
        }

        // Create leave request
        const result = await query(
            'INSERT INTO leave_requests (user_id, start_date, end_date, reason, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [userId, startDate, endDate, reason, 'Pending']
        );

        res.status(201).json({
            success: true,
            message: 'Leave request submitted successfully',
            data: {
                leaveRequest: result.rows[0],
            },
        });
    } catch (error) {
        console.error('Create leave request error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating leave request',
            error: error.message,
        });
    }
};

/**
 * Get employee's own leave requests
 */
const getMyLeaveRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;

        let queryText = 'SELECT * FROM leave_requests WHERE user_id = $1';
        const params = [userId];

        if (status) {
            params.push(status);
            queryText += ` AND status = $${params.length}`;
        }

        queryText += ' ORDER BY created_at DESC';

        const result = await query(queryText, params);

        res.status(200).json({
            success: true,
            data: {
                leaveRequests: result.rows,
                count: result.rows.length,
            },
        });
    } catch (error) {
        console.error('Get my leave requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching leave requests',
            error: error.message,
        });
    }
};

/**
 * Get all leave requests (Admin/HR only)
 */
const getAllLeaveRequests = async (req, res) => {
    try {
        const { status, userId } = req.query;

        let queryText = `
      SELECT lr.*, u.name, u.email 
      FROM leave_requests lr 
      JOIN users u ON lr.user_id = u.id
    `;
        const params = [];
        const conditions = [];

        if (status) {
            params.push(status);
            conditions.push(`lr.status = $${params.length}`);
        }

        if (userId) {
            params.push(userId);
            conditions.push(`lr.user_id = $${params.length}`);
        }

        if (conditions.length > 0) {
            queryText += ' WHERE ' + conditions.join(' AND ');
        }

        queryText += ' ORDER BY lr.created_at DESC';

        const result = await query(queryText, params);

        res.status(200).json({
            success: true,
            data: {
                leaveRequests: result.rows,
                count: result.rows.length,
            },
        });
    } catch (error) {
        console.error('Get all leave requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching leave requests',
            error: error.message,
        });
    }
};

/**
 * Update leave request status (Admin/HR only)
 */
const updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        if (!['Pending', 'Approved', 'Declined'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be Pending, Approved, or Declined',
            });
        }

        // Check if leave request exists
        const existing = await query('SELECT * FROM leave_requests WHERE id = $1', [id]);

        if (existing.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found',
            });
        }

        // Update status
        const result = await query(
            'UPDATE leave_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, id]
        );

        res.status(200).json({
            success: true,
            message: 'Leave request status updated successfully',
            data: {
                leaveRequest: result.rows[0],
            },
        });
    } catch (error) {
        console.error('Update leave status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating leave request status',
            error: error.message,
        });
    }
};

module.exports = {
    createLeaveRequest,
    getMyLeaveRequests,
    getAllLeaveRequests,
    updateLeaveStatus,
};
