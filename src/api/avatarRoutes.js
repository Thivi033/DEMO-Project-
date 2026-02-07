// Avatar Upload API Routes
const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// In-memory avatar storage (use cloud storage in production)
const avatarStore = new Map();

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Upload avatar
router.post('/avatar', express.raw({ type: ALLOWED_TYPES, limit: MAX_SIZE }), (req, res) => {
    try {
        const userId = req.headers['x-user-id'];

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }

        if (!req.body || req.body.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No image data provided'
            });
        }

        const contentType = req.headers['content-type'];
        if (!ALLOWED_TYPES.includes(contentType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid file type'
            });
        }

        const avatarId = crypto.randomBytes(16).toString('hex');
        const avatarData = {
            id: avatarId,
            userId,
            data: req.body.toString('base64'),
            contentType,
            uploadedAt: new Date().toISOString()
        };

        avatarStore.set(userId, avatarData);

        res.status(201).json({
            success: true,
            message: 'Avatar uploaded successfully',
            avatarId,
            url: `/api/avatar/${userId}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to upload avatar'
        });
    }
});

// Get avatar
router.get('/avatar/:userId', (req, res) => {
    const { userId } = req.params;
    const avatar = avatarStore.get(userId);

    if (!avatar) {
        return res.status(404).json({
            success: false,
            error: 'Avatar not found'
        });
    }

    const imageBuffer = Buffer.from(avatar.data, 'base64');
    res.set('Content-Type', avatar.contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(imageBuffer);
});

// Delete avatar
router.delete('/avatar/:userId', (req, res) => {
    const { userId } = req.params;
    const requestUserId = req.headers['x-user-id'];

    if (requestUserId !== userId) {
        return res.status(403).json({
            success: false,
            error: 'Unauthorized to delete this avatar'
        });
    }

    if (!avatarStore.has(userId)) {
        return res.status(404).json({
            success: false,
            error: 'Avatar not found'
        });
    }

    avatarStore.delete(userId);

    res.status(200).json({
        success: true,
        message: 'Avatar deleted successfully'
    });
});

module.exports = router;
