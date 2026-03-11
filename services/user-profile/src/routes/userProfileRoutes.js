const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController');
const { authenticate } = require('../middleware/auth');

// Sync user after signup (called from frontend after Clerk auth)
router.post('/sync', authenticate, userProfileController.syncUser);

// Get user profile
router.get('/:clerkUserId', authenticate, userProfileController.getUserProfile);

// Update profile info
router.put('/:clerkUserId', authenticate, userProfileController.updateProfile);

// Update preferences
router.put('/:clerkUserId/preferences', authenticate, userProfileController.updatePreferences);

// Listening history
router.get('/:clerkUserId/history', authenticate, userProfileController.getListeningHistory);
router.post('/:clerkUserId/history', authenticate, userProfileController.addToHistory);

// Internal endpoint (called by Recommendation Service)
router.get('/:clerkUserId/internal/preferences', authenticate, userProfileController.getUserPreferences);

module.exports = router;
