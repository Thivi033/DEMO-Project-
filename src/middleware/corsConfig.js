// CORS Configuration Middleware
const corsConfig = (options = {}) => {
    const {
        allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        allowCredentials = true,
        allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With', 'X-User-Id'],
        exposedHeaders = ['X-Total-Count', 'X-Request-Id'],
        maxAge = 86400 // 24 hours
    } = options;

    return (req, res, next) => {
        const origin = req.headers.origin;

        // Check if origin is allowed
        if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }

        // Set credentials header
        if (allowCredentials) {
            res.setHeader('Access-Control-Allow-Credentials', 'true');
        }

        // Set exposed headers
        if (exposedHeaders.length > 0) {
            res.setHeader('Access-Control-Expose-Headers', exposedHeaders.join(', '));
        }

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Methods', allowedMethods.join(', '));
            res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));
            res.setHeader('Access-Control-Max-Age', maxAge.toString());
            return res.status(204).end();
        }

        next();
    };
};

// Environment-specific CORS configurations
const corsPresets = {
    development: {
        allowedOrigins: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
        allowCredentials: true
    },
    staging: {
        allowedOrigins: process.env.STAGING_ORIGINS?.split(',') || [],
        allowCredentials: true
    },
    production: {
        allowedOrigins: process.env.PRODUCTION_ORIGINS?.split(',') || [],
        allowCredentials: true,
        maxAge: 86400
    }
};

const getCorsConfig = () => {
    const env = process.env.NODE_ENV || 'development';
    return corsPresets[env] || corsPresets.development;
};

module.exports = { corsConfig, corsPresets, getCorsConfig };
