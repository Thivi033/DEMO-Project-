// Request Logger Middleware
const crypto = require('crypto');

const generateRequestId = () => {
    return crypto.randomBytes(8).toString('hex');
};

const formatDuration = (startTime) => {
    const duration = Date.now() - startTime;
    return `${duration}ms`;
};

const requestLogger = (options = {}) => {
    const {
        logBody = false,
        logHeaders = false,
        excludePaths = ['/health', '/ready', '/favicon.ico']
    } = options;

    return (req, res, next) => {
        // Skip logging for excluded paths
        if (excludePaths.includes(req.path)) {
            return next();
        }

        const requestId = generateRequestId();
        const startTime = Date.now();

        // Attach request ID to request object
        req.requestId = requestId;

        // Build request log object
        const requestLog = {
            timestamp: new Date().toISOString(),
            requestId,
            type: 'REQUEST',
            method: req.method,
            url: req.originalUrl,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
        };

        if (logHeaders) {
            requestLog.headers = req.headers;
        }

        if (logBody && req.body && Object.keys(req.body).length > 0) {
            // Mask sensitive fields
            const sanitizedBody = { ...req.body };
            const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
            sensitiveFields.forEach(field => {
                if (sanitizedBody[field]) {
                    sanitizedBody[field] = '[REDACTED]';
                }
            });
            requestLog.body = sanitizedBody;
        }

        console.log(JSON.stringify(requestLog));

        // Capture response
        const originalSend = res.send;
        res.send = function(body) {
            const responseLog = {
                timestamp: new Date().toISOString(),
                requestId,
                type: 'RESPONSE',
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                duration: formatDuration(startTime)
            };

            console.log(JSON.stringify(responseLog));

            return originalSend.call(this, body);
        };

        next();
    };
};

module.exports = requestLogger;
