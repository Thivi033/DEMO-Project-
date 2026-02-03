// Authentication API endpoints
const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const crypto = require('crypto');

// Standardized error response helper
const sendErrorResponse = (res, statusCode, errorCode, message, details = null) => {
    const response = {
        success: false,
        error: {
            code: errorCode,
            message: message,
            timestamp: new Date().toISOString()
        }
    };
    if (details) {
        response.error.details = details;
    }
    return res.status(statusCode).json(response);
};

// Standardized success response helper
const sendSuccessResponse = (res, statusCode, message, data = null) => {
    const response = {
        success: true,
        message: message,
        timestamp: new Date().toISOString()
    };
    if (data) {
        response.data = data;
    }
    return res.status(statusCode).json(response);
};

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return sendErrorResponse(res, 400, 'MISSING_EMAIL', 'Email address is required');
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`;

        await emailService.sendPasswordResetEmail(email, resetLink);
        return sendSuccessResponse(res, 200, 'Reset email sent successfully');
    } catch (error) {
        return sendErrorResponse(res, 500, 'EMAIL_SEND_FAILED', 'Failed to send reset email', error.message);
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token) {
            return sendErrorResponse(res, 400, 'MISSING_TOKEN', 'Reset token is required');
        }

        if (!newPassword) {
            return sendErrorResponse(res, 400, 'MISSING_PASSWORD', 'New password is required');
        }

        if (newPassword.length < 8) {
            return sendErrorResponse(res, 400, 'WEAK_PASSWORD', 'Password must be at least 8 characters');
        }

        return sendSuccessResponse(res, 200, 'Password updated successfully');
    } catch (error) {
        return sendErrorResponse(res, 500, 'PASSWORD_RESET_FAILED', 'Failed to reset password', error.message);
    }
});

module.exports = router;
