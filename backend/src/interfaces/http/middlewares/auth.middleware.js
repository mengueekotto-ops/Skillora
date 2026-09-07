const { User } = require('../../../infrastructure/database/sequelize');
const { verifyAccessToken } = require('../../../infrastructure/utils/auth.utils');

/**
 * Middleware: Verify request has a valid access JWT token and attach user to request object.
 */
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 'error',
                message: 'Access Denied: No Bearer Token Provided'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyAccessToken(token);
        if (!decoded) {
            return res.status(401).json({
                status: 'error',
                message: 'Access Denied: Invalid or Expired Token'
            });
        }

        // Fetch user from DB to verify existence and security status
        const user = await User.findByPk(decoded.id);
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Access Denied: User Associated With Token Does Not Exist'
            });
        }

        if (user.status !== 'active') {
            return res.status(403).json({
                status: 'error',
                message: 'Access Denied: Your Account Is Suspended'
            });
        }

        // Attach parsed user to req
        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication Middleware error:', error);
        next(error);
    }
}

/**
 * Middleware: Verify user role has proper access authorization.
 * @param {string[]} allowedRoles
 */
function authorize(allowedRoles = []) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: 'error',
                message: 'Unauthorized: User authentication is required'
            });
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: `Forbidden: Resource restricts role permissions (required: ${allowedRoles.join(', ')})`
            });
        }

        next();
    };
}

module.exports = {
    authenticate,
    authorize
};
