// OAuth2 Authentication Strategies
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const { generateTokenPair } = require('./jwt');

// In-memory user store (use database in production)
const oauthUsers = new Map();

// OAuth Configuration
const OAUTH_CONFIG = {
    google: {
        clientID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback'
    },
    github: {
        clientID: process.env.GITHUB_CLIENT_ID || 'your-github-client-id',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || 'your-github-client-secret',
        callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback'
    }
};

/**
 * Find or create user from OAuth profile
 * @param {string} provider - OAuth provider (google, github)
 * @param {Object} profile - OAuth profile data
 * @returns {Object} - User object
 */
function findOrCreateOAuthUser(provider, profile) {
    const providerId = `${provider}_${profile.id}`;
    const email = profile.emails?.[0]?.value || profile.email || null;

    // Check if user exists by provider ID
    let user = oauthUsers.get(providerId);

    if (user) {
        // Update user's last login
        user.lastLogin = new Date().toISOString();
        return user;
    }

    // Check if user exists by email (for account linking)
    if (email) {
        for (const [key, existingUser] of oauthUsers.entries()) {
            if (existingUser.email === email) {
                // Link this OAuth provider to existing account
                existingUser.providers = existingUser.providers || [];
                existingUser.providers.push({
                    name: provider,
                    id: profile.id,
                    linkedAt: new Date().toISOString()
                });
                oauthUsers.set(providerId, existingUser);
                return existingUser;
            }
        }
    }

    // Create new user
    user = {
        id: providerId,
        email: email,
        name: profile.displayName || profile.username || 'Unknown',
        avatar: profile.photos?.[0]?.value || null,
        providers: [{
            name: provider,
            id: profile.id,
            linkedAt: new Date().toISOString()
        }],
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
    };

    oauthUsers.set(providerId, user);
    return user;
}

/**
 * Configure Google OAuth Strategy
 */
function configureGoogleStrategy() {
    passport.use(new GoogleStrategy({
        clientID: OAUTH_CONFIG.google.clientID,
        clientSecret: OAUTH_CONFIG.google.clientSecret,
        callbackURL: OAUTH_CONFIG.google.callbackURL,
        scope: ['profile', 'email']
    }, (accessToken, refreshToken, profile, done) => {
        try {
            const user = findOrCreateOAuthUser('google', profile);
            return done(null, {
                user,
                oauthTokens: {
                    accessToken,
                    refreshToken
                }
            });
        } catch (error) {
            return done(error, null);
        }
    }));
}

/**
 * Configure GitHub OAuth Strategy
 */
function configureGitHubStrategy() {
    passport.use(new GitHubStrategy({
        clientID: OAUTH_CONFIG.github.clientID,
        clientSecret: OAUTH_CONFIG.github.clientSecret,
        callbackURL: OAUTH_CONFIG.github.callbackURL,
        scope: ['user:email']
    }, (accessToken, refreshToken, profile, done) => {
        try {
            const user = findOrCreateOAuthUser('github', profile);
            return done(null, {
                user,
                oauthTokens: {
                    accessToken,
                    refreshToken
                }
            });
        } catch (error) {
            return done(error, null);
        }
    }));
}

/**
 * Serialize user for session
 */
passport.serializeUser((data, done) => {
    done(null, data.user.id);
});

/**
 * Deserialize user from session
 */
passport.deserializeUser((id, done) => {
    const user = oauthUsers.get(id);
    done(null, user || null);
});

/**
 * Initialize all OAuth strategies
 */
function initializeOAuth() {
    configureGoogleStrategy();
    configureGitHubStrategy();
}

/**
 * Handle OAuth callback success
 * Generates JWT tokens for the authenticated user
 * @param {Object} user - Authenticated user
 * @returns {Object} - JWT tokens and user info
 */
function handleOAuthSuccess(user) {
    const tokens = generateTokenPair({
        id: user.id,
        email: user.email
    });

    return {
        success: true,
        message: 'OAuth authentication successful',
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar
        },
        ...tokens
    };
}

/**
 * Handle OAuth callback error
 * @param {Error} error - Error object
 * @returns {Object} - Error response
 */
function handleOAuthError(error) {
    console.error('[OAUTH] Authentication error:', error);
    return {
        success: false,
        error: 'OAuthError',
        message: error.message || 'OAuth authentication failed'
    };
}

/**
 * Get user by OAuth ID
 * @param {string} oauthId - OAuth user ID
 * @returns {Object|null} - User object or null
 */
function getOAuthUser(oauthId) {
    return oauthUsers.get(oauthId) || null;
}

/**
 * Unlink OAuth provider from user account
 * @param {string} userId - User ID
 * @param {string} provider - Provider to unlink
 * @returns {boolean} - Success status
 */
function unlinkOAuthProvider(userId, provider) {
    const user = oauthUsers.get(userId);

    if (!user || !user.providers) {
        return false;
    }

    // Don't allow unlinking if it's the only auth method
    if (user.providers.length <= 1) {
        return false;
    }

    user.providers = user.providers.filter(p => p.name !== provider);

    // Remove the provider-specific entry
    const providerKey = `${provider}_${user.providers.find(p => p.name === provider)?.id}`;
    oauthUsers.delete(providerKey);

    return true;
}

module.exports = {
    passport,
    initializeOAuth,
    handleOAuthSuccess,
    handleOAuthError,
    getOAuthUser,
    unlinkOAuthProvider,
    OAUTH_CONFIG
};
