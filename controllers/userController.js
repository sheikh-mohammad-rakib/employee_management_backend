const { query } = require('../config/database');

/**
 * Get all users (Admin/HR only)
 */
const getAllUsers = async (req, res) => {
    try {
        const { role } = req.query;

        let queryText = 'SELECT id, name, email, role, created_at FROM users';
        const params = [];

        if (role) {
            params.push(role);
            queryText += ` WHERE role = $${params.length}`;
        }

        queryText += ' ORDER BY created_at DESC';

        const result = await query(queryText, params);

        res.status(200).json({
            success: true,
            data: {
                users: result.rows,
                count: result.rows.length,
            },
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message,
        });
    }
};

/**
 * Get user profile
 */
const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await query(
            'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.status(200).json({
            success: true,
            data: {
                user: result.rows[0],
            },
        });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user profile',
            error: error.message,
        });
    }
};

module.exports = {
    getAllUsers,
    getUserProfile,
};
