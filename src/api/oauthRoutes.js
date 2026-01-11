// OAuth API Routes
const express = require('express');
const router = express.Router();
const {
    passport,
    handleOAuthSuccess,
    handleOAuthError
} = require('../auth/oauth');

// Frontend URL for redirects
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Helper to generate redirect URL with tokens
 * @param {Object} result - OAuth result with tokens
 * @returns {string} - Redirect URL
 */
function generateRedirectUrl(result) {
    const params = new URLSearchParams({
        success: result.success.toString(),
        accessToken: result.accessToken || '',
        refreshToken: result.refreshToken || '',
        expiresIn: result.expiresIn?.toString() || ''
    });
    return `${FRONTEND_URL}/oauth/callback?${params.toString()}`;
}

/**
 * Helper to generate error redirect URL
 * @param {string} error - Error message
 * @returns {string} - Error redirect URL
 */
function generateErrorRedirectUrl(error) {
    const params = new URLSearchParams({
        success: 'false',
        error: error
    });
    return `${FRONTEND_URL}/oauth/callback?${params.toString()}`;
}

// ============================================
// GOOGLE OAUTH ROUTES
// ============================================

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth flow
 * @access  Public
 */
router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })
);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get('/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: `${FRONTEND_URL}/login?error=google_auth_failed`
    }),
    (req, res) => {
        try {
            if (!req.user || !req.user.user) {
                return res.redirect(generateErrorRedirectUrl('Google authentication failed'));
            }

            const result = handleOAuthSuccess(req.user.user);
            return res.redirect(generateRedirectUrl(result));
        } catch (error) {
            console.error('[OAUTH] Google callback error:', error);
            return res.redirect(generateErrorRedirectUrl('Authentication error'));
        }
    }
);

// ============================================
// GITHUB OAUTH ROUTES
// ============================================

/**
 * @route   GET /api/auth/github
 * @desc    Initiate GitHub OAuth flow
 * @access  Public
 */
router.get('/github',
    passport.authenticate('github', {
        scope: ['user:email']
    })
);

/**
 * @route   GET /api/auth/github/callback
 * @desc    GitHub OAuth callback
 * @access  Public
 */
router.get('/github/callback',
    passport.authenticate('github', {
        session: false,
        failureRedirect: `${FRONTEND_URL}/login?error=github_auth_failed`
    }),
    (req, res) => {
        try {
            if (!req.user || !req.user.user) {
                return res.redirect(generateErrorRedirectUrl('GitHub authentication failed'));
            }

            const result = handleOAuthSuccess(req.user.user);
            return res.redirect(generateRedirectUrl(result));
        } catch (error) {
            console.error('[OAUTH] GitHub callback error:', error);
            return res.redirect(generateErrorRedirectUrl('Authentication error'));
        }
    }
);

// ============================================
// OAUTH STATUS & UTILITY ROUTES
// ============================================

/**
 * @route   GET /api/auth/oauth/providers
 * @desc    Get available OAuth providers
 * @access  Public
 */
router.get('/oauth/providers', (req, res) => {
    res.json({
        success: true,
        providers: [
            {
                name: 'google',
                displayName: 'Google',
                authUrl: '/api/auth/google',
                icon: 'google'
            },
            {
                name: 'github',
                displayName: 'GitHub',
                authUrl: '/api/auth/github',
                icon: 'github'
            }
        ]
    });
});

/**
 * @route   POST /api/auth/oauth/token
 * @desc    Exchange OAuth code for JWT tokens (for mobile/SPA apps)
 * @access  Public
 */
router.post('/oauth/token', async (req, res) => {
    try {
        const { provider, code, redirectUri } = req.body;

        if (!provider || !code) {
            return res.status(400).json({
                success: false,
                message: 'Provider and code are required'
            });
        }

        // Validate provider
        if (!['google', 'github'].includes(provider)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OAuth provider'
            });
        }

        // Note: In production, implement code exchange with provider's token endpoint
        return res.status(501).json({
            success: false,
            message: 'Direct token exchange not implemented. Use OAuth redirect flow.'
        });
    } catch (error) {
        console.error('[OAUTH] Token exchange error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
