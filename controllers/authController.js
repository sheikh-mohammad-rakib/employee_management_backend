const { query } = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { generateOTP, getOTPExpiration, isOTPExpired } = require('../utils/otp');

/**
 * Register a new user
 */
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Validate input
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: name, email, password, role',
            });
        }

        // Validate role
        if (!['employee', 'admin', 'hr'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be employee, admin, or hr',
            });
        }

        // Check if user already exists
        const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists',
            });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const result = await query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
            [name, email, hashedPassword, role]
        );

        const user = result.rows[0];

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    createdAt: user.created_at,
                },
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message,
        });
    }
};

/**
 * Login user
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password',
            });
        }

        // Find user
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        const user = result.rows[0];

        // Check password
        const isPasswordValid = await comparePassword(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Generate JWT token
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message,
        });
    }
};

/**
 * Request OTP for password change
 */
const requestOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email',
            });
        }

        // Find user
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        const user = result.rows[0];

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = getOTPExpiration(parseInt(process.env.OTP_EXPIRE_MINUTES) || 10);

        // Save OTP to database
        await query(
            'INSERT INTO otp_tokens (user_id, otp, expires_at) VALUES ($1, $2, $3)',
            [user.id, otp, expiresAt]
        );

        // In production, send OTP via email/SMS
        // For development, log to console
        console.log(`\n🔐 OTP for ${email}: ${otp}`);
        console.log(`⏰ Expires at: ${expiresAt}\n`);

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully. Check your email/console.',
            data: {
                // In development, return OTP. Remove in production!
                otp: process.env.NODE_ENV === 'development' ? otp : undefined,
            },
        });
    } catch (error) {
        console.error('Request OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Error requesting OTP',
            error: error.message,
        });
    }
};

/**
 * Verify OTP and change password
 */
const verifyOTPAndChangePassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email, OTP, and new password',
            });
        }

        // Find user
        const userResult = await query('SELECT * FROM users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        const user = userResult.rows[0];

        // Find valid OTP
        const otpResult = await query(
            'SELECT * FROM otp_tokens WHERE user_id = $1 AND otp = $2 AND used = FALSE ORDER BY created_at DESC LIMIT 1',
            [user.id, otp]
        );

        if (otpResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP',
            });
        }

        const otpToken = otpResult.rows[0];

        // Check if OTP is expired
        if (isOTPExpired(otpToken.expires_at)) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired',
            });
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update password
        await query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);

        // Mark OTP as used
        await query('UPDATE otp_tokens SET used = TRUE WHERE id = $1', [otpToken.id]);

        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying OTP and changing password',
            error: error.message,
        });
    }
};

module.exports = {
    register,
    login,
    requestOTP,
    verifyOTPAndChangePassword,
};
