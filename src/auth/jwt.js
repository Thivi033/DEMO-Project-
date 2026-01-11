// JWT Authentication module
const crypto = require('crypto');

// Configuration - In production, use environment variables
const JWT_CONFIG = {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'your-access-token-secret-key-change-in-production',
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret-key-change-in-production',
    accessTokenExpiry: 15 * 60,          // 15 minutes in seconds
    refreshTokenExpiry: 7 * 24 * 60 * 60  // 7 days in seconds
};

// In-memory store for refresh tokens (use Redis or database in production)
const refreshTokenStore = new Map();

/**
 * Base64Url encode a string
 * @param {string} str - String to encode
 * @returns {string} - Base64Url encoded string
 */
function base64UrlEncode(str) {
    return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Base64Url decode a string
 * @param {string} str - Base64Url encoded string
 * @returns {string} - Decoded string
 */
function base64UrlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
        str += '=';
    }
    return Buffer.from(str, 'base64').toString('utf8');
}

/**
 * Create HMAC SHA256 signature
 * @param {string} data - Data to sign
 * @param {string} secret - Secret key
 * @returns {string} - Base64Url encoded signature
 */
function createSignature(data, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(data);
    return base64UrlEncode(hmac.digest('base64'));
}

/**
 * Generate a JWT token
 * @param {Object} payload - Token payload
 * @param {string} secret - Secret key for signing
 * @param {number} expiresIn - Expiry time in seconds
 * @returns {string} - JWT token
 */
function generateToken(payload, secret, expiresIn) {
    const header = {
        alg: 'HS256',
        typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const tokenPayload = {
        ...payload,
        iat: now,
        exp: now + expiresIn
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(tokenPayload));
    const signature = createSignature(`${encodedHeader}.${encodedPayload}`, secret);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @param {string} secret - Secret key for verification
 * @returns {Object} - Decoded payload or error
 */
function verifyToken(token, secret) {
    try {
        if (!token || typeof token !== 'string') {
            return { valid: false, error: 'Token is required' };
        }

        const parts = token.split('.');
        if (parts.length !== 3) {
            return { valid: false, error: 'Invalid token format' };
        }

        const [encodedHeader, encodedPayload, signature] = parts;

        // Verify signature
        const expectedSignature = createSignature(`${encodedHeader}.${encodedPayload}`, secret);
        if (signature !== expectedSignature) {
            return { valid: false, error: 'Invalid signature' };
        }

        // Decode payload
        const payload = JSON.parse(base64UrlDecode(encodedPayload));

        // Check expiration
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
            return { valid: false, error: 'Token expired' };
        }

        return { valid: true, payload };
    } catch (error) {
        return { valid: false, error: 'Invalid token' };
    }
}

/**
 * Generate access token for a user
 * @param {Object} user - User object with id, email, etc.
 * @returns {string} - Access token
 */
function generateAccessToken(user) {
    const payload = {
        userId: user.id,
        email: user.email,
        type: 'access'
    };
    return generateToken(payload, JWT_CONFIG.accessTokenSecret, JWT_CONFIG.accessTokenExpiry);
}

/**
 * Generate refresh token for a user
 * @param {Object} user - User object with id, email, etc.
 * @returns {string} - Refresh token
 */
function generateRefreshToken(user) {
    const payload = {
        userId: user.id,
        email: user.email,
        type: 'refresh',
        tokenId: crypto.randomBytes(16).toString('hex')
    };
    const token = generateToken(payload, JWT_CONFIG.refreshTokenSecret, JWT_CONFIG.refreshTokenExpiry);

    // Store refresh token
    refreshTokenStore.set(payload.tokenId, {
        userId: user.id,
        createdAt: Date.now(),
        expiresAt: Date.now() + (JWT_CONFIG.refreshTokenExpiry * 1000)
    });

    return token;
}

/**
 * Verify access token
 * @param {string} token - Access token
 * @returns {Object} - Verification result
 */
function verifyAccessToken(token) {
    const result = verifyToken(token, JWT_CONFIG.accessTokenSecret);
    if (result.valid && result.payload.type !== 'access') {
        return { valid: false, error: 'Invalid token type' };
    }
    return result;
}

/**
 * Verify refresh token
 * @param {string} token - Refresh token
 * @returns {Object} - Verification result
 */
function verifyRefreshToken(token) {
    const result = verifyToken(token, JWT_CONFIG.refreshTokenSecret);

    if (!result.valid) {
        return result;
    }

    if (result.payload.type !== 'refresh') {
        return { valid: false, error: 'Invalid token type' };
    }

    // Check if token exists in store (hasn't been revoked)
    const storedToken = refreshTokenStore.get(result.payload.tokenId);
    if (!storedToken) {
        return { valid: false, error: 'Token has been revoked' };
    }

    return result;
}

/**
 * Refresh tokens - generates new access and refresh tokens
 * @param {string} refreshToken - Current refresh token
 * @returns {Object} - New tokens or error
 */
function refreshTokens(refreshToken) {
    const verification = verifyRefreshToken(refreshToken);

    if (!verification.valid) {
        return { success: false, error: verification.error };
    }

    // Revoke old refresh token
    refreshTokenStore.delete(verification.payload.tokenId);

    // Generate new tokens
    const user = {
        id: verification.payload.userId,
        email: verification.payload.email
    };

    return {
        success: true,
        accessToken: generateAccessToken(user),
        refreshToken: generateRefreshToken(user)
    };
}

/**
 * Revoke a refresh token
 * @param {string} token - Refresh token to revoke
 * @returns {boolean} - Success status
 */
function revokeRefreshToken(token) {
    try {
        const result = verifyToken(token, JWT_CONFIG.refreshTokenSecret);
        if (result.valid && result.payload.tokenId) {
            refreshTokenStore.delete(result.payload.tokenId);
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

/**
 * Revoke all refresh tokens for a user
 * @param {string} userId - User ID
 */
function revokeAllUserTokens(userId) {
    for (const [tokenId, data] of refreshTokenStore.entries()) {
        if (data.userId === userId) {
            refreshTokenStore.delete(tokenId);
        }
    }
}

/**
 * Generate both access and refresh tokens for a user
 * @param {Object} user - User object
 * @returns {Object} - Token pair
 */
function generateTokenPair(user) {
    return {
        accessToken: generateAccessToken(user),
        refreshToken: generateRefreshToken(user),
        expiresIn: JWT_CONFIG.accessTokenExpiry
    };
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateTokenPair,
    verifyAccessToken,
    verifyRefreshToken,
    refreshTokens,
    revokeRefreshToken,
    revokeAllUserTokens,
    JWT_CONFIG
};
