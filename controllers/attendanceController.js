const { query } = require('../config/database');

/**
 * Employee check-in
 */
const checkIn = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        // Check if already checked in today
        const existing = await query(
            'SELECT * FROM attendance WHERE user_id = $1 AND date = $2',
            [userId, today]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'You have already checked in today',
            });
        }

        // Create check-in record
        const result = await query(
            'INSERT INTO attendance (user_id, check_in, date) VALUES ($1, $2, $3) RETURNING *',
            [userId, new Date(), today]
        );

        res.status(201).json({
            success: true,
            message: 'Checked in successfully',
            data: {
                attendance: result.rows[0],
            },
        });
    } catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking in',
            error: error.message,
        });
    }
};

/**
 * Employee check-out
 */
const checkOut = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        // Find today's attendance record
        const result = await query(
            'SELECT * FROM attendance WHERE user_id = $1 AND date = $2',
            [userId, today]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'You have not checked in today',
            });
        }

        const attendance = result.rows[0];

        if (attendance.check_out) {
            return res.status(400).json({
                success: false,
                message: 'You have already checked out today',
            });
        }

        // Update with check-out time
        const updated = await query(
            'UPDATE attendance SET check_out = $1 WHERE id = $2 RETURNING *',
            [new Date(), attendance.id]
        );

        res.status(200).json({
            success: true,
            message: 'Checked out successfully',
            data: {
                attendance: updated.rows[0],
            },
        });
    } catch (error) {
        console.error('Check-out error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking out',
            error: error.message,
        });
    }
};

/**
 * Get employee's own attendance records
 */
const getMyAttendance = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 30 } = req.query;

        const result = await query(
            'SELECT * FROM attendance WHERE user_id = $1 ORDER BY date DESC LIMIT $2',
            [userId, limit]
        );

        res.status(200).json({
            success: true,
            data: {
                attendance: result.rows,
                count: result.rows.length,
            },
        });
    } catch (error) {
        console.error('Get my attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching attendance records',
            error: error.message,
        });
    }
};

/**
 * Get all attendance records (Admin/HR only)
 */
const getAllAttendance = async (req, res) => {
    try {
        const { userId, date, limit = 100 } = req.query;

        let queryText = `
      SELECT a.*, u.name, u.email 
      FROM attendance a 
      JOIN users u ON a.user_id = u.id
    `;
        const params = [];
        const conditions = [];

        if (userId) {
            params.push(userId);
            conditions.push(`a.user_id = $${params.length}`);
        }

        if (date) {
            params.push(date);
            conditions.push(`a.date = $${params.length}`);
        }

        if (conditions.length > 0) {
            queryText += ' WHERE ' + conditions.join(' AND ');
        }

        params.push(limit);
        queryText += ` ORDER BY a.date DESC, a.check_in DESC LIMIT $${params.length}`;

        const result = await query(queryText, params);

        res.status(200).json({
            success: true,
            data: {
                attendance: result.rows,
                count: result.rows.length,
            },
        });
    } catch (error) {
        console.error('Get all attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching attendance records',
            error: error.message,
        });
    }
};

/**
 * Get today's attendance status for employee
 */
const getTodayStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        const result = await query(
            'SELECT * FROM attendance WHERE user_id = $1 AND date = $2',
            [userId, today]
        );

        res.status(200).json({
            success: true,
            data: {
                hasCheckedIn: result.rows.length > 0,
                hasCheckedOut: result.rows.length > 0 && result.rows[0].check_out !== null,
                attendance: result.rows.length > 0 ? result.rows[0] : null,
            },
        });
    } catch (error) {
        console.error('Get today status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching today\'s status',
            error: error.message,
        });
    }
};

module.exports = {
    checkIn,
    checkOut,
    getMyAttendance,
    getAllAttendance,
    getTodayStatus,
};
