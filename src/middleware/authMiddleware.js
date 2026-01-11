// Authentication middleware for protected routes
const { verifyAccessToken } = require('../auth/jwt');

/**
 * Extract token from Authorization header
 * @param {Object} req - Express request object
 * @returns {string|null} - Token or null
 */
function extractToken(req) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return null;
    }

    // Support both "Bearer <token>" and raw token formats
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }

    return authHeader;
}

/**
 * Authentication middleware - verifies JWT access token
 * Attaches user data to req.user if valid
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function authenticate(req, res, next) {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'Authentication token is required'
        });
    }

    const result = verifyAccessToken(token);

    if (!result.valid) {
        // Determine appropriate error response
        if (result.error === 'Token expired') {
            return res.status(401).json({
                success: false,
                error: 'TokenExpired',
                message: 'Access token has expired. Please refresh your token.'
            });
        }

        return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: result.error || 'Invalid authentication token'
        });
    }

    // Attach user data to request
    req.user = {
        id: result.payload.userId,
        email: result.payload.email
    };

    next();
}

/**
 * Optional authentication middleware
 * Attaches user data if token is valid, but doesn't block if missing/invalid
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function optionalAuth(req, res, next) {
    const token = extractToken(req);

    if (token) {
        const result = verifyAccessToken(token);
        if (result.valid) {
            req.user = {
                id: result.payload.userId,
                email: result.payload.email
            };
        }
    }

    next();
}

/**
 * Require specific user ID middleware
 * Must be used after authenticate middleware
 * @param {string} paramName - Request param name containing user ID
 * @returns {Function} - Middleware function
 */
function requireSameUser(paramName = 'userId') {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
                message: 'Authentication required'
            });
        }

        const requestedUserId = req.params[paramName];

        if (req.user.id !== requestedUserId) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'You do not have permission to access this resource'
            });
        }

        next();
    };
}

module.exports = {
    authenticate,
    optionalAuth,
    requireSameUser,
    extractToken
};
