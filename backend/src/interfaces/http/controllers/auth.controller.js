const { User } = require('../../../infrastructure/database/sequelize');
const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
} = require('../../../infrastructure/utils/auth.utils');

class AuthController {
    /**
     * Register a new user
     */
    static async register(req, res, next) {
        try {
            const { email, password, role, name, phone_number } = req.body;

            // Simple validation
            if (!email || !password) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Email and password are required'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Password must be at least 6 characters long'
                });
            }

            // Check if email already exists
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Email is already registered'
                });
            }

            // Allowed roles check
            const allowedRoles = ['admin', 'customer', 'farmer', 'supplier', 'delivery_guy', 'advisor', 'investor'];
            const userRole = role && allowedRoles.includes(role) ? role : 'customer';

            // Create user (Sequelize hooks will automatically hash the password)
            const user = await User.create({
                email,
                password,
                role: userRole,
                name: name || null,
                phone_number: phone_number || null
            });

            return res.status(201).json({
                status: 'success',
                message: 'User registered successfully',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        status: user.status
                    }
                }
            });
        } catch (error) {
            console.error('Registration controller error:', error);
            next(error);
        }
    }

    /**
     * User Login
     */
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Email and password are required'
                });
            }

            // Find user in DB
            const user = await User.findOne({ where: { email } });
            if (!user) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid email or password'
                });
            }

            if (user.status !== 'active') {
                return res.status(403).json({
                    status: 'error',
                    message: 'Your account is suspended'
                });
            }

            // Verify password using model instance method
            const isPasswordValid = await user.validatePassword(password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid email or password'
                });
            }

            // Generate token credentials
            const accessToken = generateAccessToken(user);
            const refreshToken = generateRefreshToken(user);

            return res.status(200).json({
                status: 'success',
                message: 'Logged in successfully',
                data: {
                    accessToken,
                    refreshToken,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        phone_number: user.phone_number,
                        role: user.role
                    }
                }
            });
        } catch (error) {
            console.error('Login controller error:', error);
            next(error);
        }
    }

    /**
     * Refresh access tokens
     */
    static async refresh(req, res, next) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Refresh token is required'
                });
            }

            const decoded = verifyRefreshToken(refreshToken);
            if (!decoded) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid or expired refresh token'
                });
            }

            // Fetch active user
            const user = await User.findByPk(decoded.id);
            if (!user) {
                return res.status(401).json({
                    status: 'error',
                    message: 'User associated with token does not exist'
                });
            }

            if (user.status !== 'active') {
                return res.status(403).json({
                    status: 'error',
                    message: 'Your account is suspended'
                });
            }

            // Generate a fresh access token
            const accessToken = generateAccessToken(user);

            return res.status(200).json({
                status: 'success',
                data: {
                    accessToken
                }
            });
        } catch (error) {
            console.error('Token refresh error:', error);
            next(error);
        }
    }

    /**
     * User Logout
     */
    static async logout(req, res, next) {
        try {
            // For stateless JWT, we request client discards the tokens.
            // A success response verifies endpoints connect cleanly.
            return res.status(200).json({
                status: 'success',
                message: 'Logged out successfully'
            });
        } catch (error) {
            console.error('Logout error:', error);
            next(error);
        }
    }

    /**
     * Request Password Reset (Stub)
     */
    static async requestPasswordReset(req, res, next) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Email is required'
                });
            }

            // Stub message indicating reset flow triggered
            return res.status(200).json({
                status: 'success',
                message: `Password reset link sent to ${email} (simulated)`
            });
        } catch (error) {
            console.error('Password reset request error:', error);
            next(error);
        }
    }

    /**
     * Confirm Password Reset (Stub)
     */
    static async confirmPasswordReset(req, res, next) {
        try {
            const { token, newPassword } = req.body;
            if (!token || !newPassword) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Reset token and new password are required'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    status: 'error',
                    message: 'New password must be at least 6 characters long'
                });
            }

            // Stub success message
            return res.status(200).json({
                status: 'success',
                message: 'Password has been reset successfully (simulated)'
            });
        } catch (error) {
            console.error('Password reset confirmation error:', error);
            next(error);
        }
    }
}

module.exports = AuthController;
