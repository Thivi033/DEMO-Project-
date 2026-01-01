// Authentication API endpoints
const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const crypto = require('crypto');

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
    
    await emailService.sendPasswordResetEmail(email, resetLink);
    res.json({ success: true, message: 'Reset email sent' });
});

router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    res.json({ success: true, message: 'Password updated' });
});

module.exports = router;
