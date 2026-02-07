// Health Check Routes
const express = require('express');
const router = express.Router();

const startTime = Date.now();

// Liveness probe - indicates if application is running
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - startTime) / 1000),
        version: process.env.npm_package_version || '1.0.0'
    });
});

// Readiness probe - indicates if application is ready to accept traffic
router.get('/ready', async (req, res) => {
    const checks = {
        memory: checkMemory(),
        environment: checkEnvironment()
    };

    const allHealthy = Object.values(checks).every(check => check.status === 'ok');

    if (allHealthy) {
        res.status(200).json({
            status: 'ready',
            timestamp: new Date().toISOString(),
            checks
        });
    } else {
        res.status(503).json({
            status: 'not_ready',
            timestamp: new Date().toISOString(),
            checks
        });
    }
});

// Memory check
function checkMemory() {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const usagePercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

    return {
        status: usagePercent < 90 ? 'ok' : 'warning',
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        usagePercent: `${usagePercent}%`
    };
}

// Environment check
function checkEnvironment() {
    const requiredVars = ['NODE_ENV'];
    const missingVars = requiredVars.filter(v => !process.env[v]);

    return {
        status: missingVars.length === 0 ? 'ok' : 'warning',
        nodeEnv: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        missingVars: missingVars.length > 0 ? missingVars : undefined
    };
}

module.exports = router;
