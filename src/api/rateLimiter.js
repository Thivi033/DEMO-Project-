// Rate limiting middleware for authentication endpoints
const rateLimitStore = new Map();

// Configuration
const RATE_LIMIT_CONFIG = {
    windowMs: 60 * 1000,        // 1 minute window
    maxAttempts: 5,              // 5 attempts per window
    blockDurationMs: 60 * 1000   // Block for 1 minute when limit exceeded
};

/**
 * Cleans up expired entries from the rate limit store
 */
function cleanupExpiredEntries() {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
        if (now > data.windowStart + RATE_LIMIT_CONFIG.windowMs) {
            rateLimitStore.delete(key);
        }
    }
}

/**
 * Gets the client identifier from the request
 * @param {Object} req - Express request object
 * @returns {string} - Client identifier (IP address)
 */
function getClientIdentifier(req) {
    return req.ip ||
           req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.connection?.remoteAddress ||
           'unknown';
}

/**
 * Rate limiting middleware for authentication endpoints
 * Limits to 5 login attempts per IP per minute
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function authRateLimiter(req, res, next) {
    // Cleanup expired entries periodically
    cleanupExpiredEntries();

    const clientId = getClientIdentifier(req);
    const now = Date.now();

    // Get or create rate limit data for this client
    let clientData = rateLimitStore.get(clientId);

    if (!clientData) {
        clientData = {
            attempts: 0,
            windowStart: now,
            blockedUntil: null
        };
        rateLimitStore.set(clientId, clientData);
    }

    // Check if client is currently blocked
    if (clientData.blockedUntil && now < clientData.blockedUntil) {
        const retryAfter = Math.ceil((clientData.blockedUntil - now) / 1000);

        console.warn(`[RATE_LIMIT] Blocked request from ${clientId}. Retry after ${retryAfter}s`);

        res.set('Retry-After', retryAfter.toString());
        return res.status(429).json({
            success: false,
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: retryAfter
        });
    }

    // Reset window if expired
    if (now > clientData.windowStart + RATE_LIMIT_CONFIG.windowMs) {
        clientData.attempts = 0;
        clientData.windowStart = now;
        clientData.blockedUntil = null;
    }

    // Increment attempt count
    clientData.attempts += 1;

    // Check if limit exceeded
    if (clientData.attempts > RATE_LIMIT_CONFIG.maxAttempts) {
        clientData.blockedUntil = now + RATE_LIMIT_CONFIG.blockDurationMs;
        const retryAfter = Math.ceil(RATE_LIMIT_CONFIG.blockDurationMs / 1000);

        console.warn(`[RATE_LIMIT] Rate limit exceeded for ${clientId}. Attempts: ${clientData.attempts}`);

        res.set('Retry-After', retryAfter.toString());
        return res.status(429).json({
            success: false,
            error: 'Too Many Requests',
            message: 'Too many login attempts. Please try again later.',
            retryAfter: retryAfter
        });
    }

    // Add rate limit headers to response
    res.set('X-RateLimit-Limit', RATE_LIMIT_CONFIG.maxAttempts.toString());
    res.set('X-RateLimit-Remaining', (RATE_LIMIT_CONFIG.maxAttempts - clientData.attempts).toString());
    res.set('X-RateLimit-Reset', new Date(clientData.windowStart + RATE_LIMIT_CONFIG.windowMs).toISOString());

    next();
}

/**
 * Resets rate limit for a specific client (useful for testing)
 * @param {string} clientId - Client identifier to reset
 */
function resetRateLimit(clientId) {
    rateLimitStore.delete(clientId);
}

/**
 * Gets current rate limit status for a client
 * @param {string} clientId - Client identifier
 * @returns {Object|null} - Rate limit data or null if not found
 */
function getRateLimitStatus(clientId) {
    return rateLimitStore.get(clientId) || null;
}

module.exports = {
    authRateLimiter,
    resetRateLimit,
    getRateLimitStatus,
    RATE_LIMIT_CONFIG
};
