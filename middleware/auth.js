const { verifyToken } = require('../utils/jwt');

/**
 * Middleware to verify JWT token and authenticate user
 */
const requireAuth = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Authorization denied.',
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = verifyToken(token);

        // Attach user info to request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token. Authorization denied.',
            error: error.message,
        });
    }
};

/**
 * Middleware to check if user has admin or HR role
 */
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin or HR role required.',
        });
    }
    next();
};

/**
 * Middleware to check if user is accessing their own resource
 * @param {string} paramName - Name of the parameter containing user ID
 */
const requireOwnerOrAdmin = (paramName = 'userId') => {
    return (req, res, next) => {
        const resourceUserId = parseInt(req.params[paramName] || req.body[paramName]);

        if (req.user.role === 'admin' || req.user.role === 'hr' || req.user.id === resourceUserId) {
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only access your own resources.',
            });
        }
    };
};

module.exports = {
    requireAuth,
    requireAdmin,
    requireOwnerOrAdmin,
};
