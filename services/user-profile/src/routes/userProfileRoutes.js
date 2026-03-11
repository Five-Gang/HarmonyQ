const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile and activity management
 */

/**
 * @swagger
 * /users/sync:
 *   post:
 *     summary: Sync user from Clerk after signup
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: User synced
 */
router.post('/sync', authenticate, userProfileController.syncUser);

/**
 * @swagger
 * /users/{clerkUserId}:
 *   get:
 *     summary: Get user profile details
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: clerkUserId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/:clerkUserId', authenticate, userProfileController.getUserProfile);

/**
 * @swagger
 * /users/{clerkUserId}:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: clerkUserId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/:clerkUserId', authenticate, userProfileController.updateProfile);

/**
 * @swagger
 * /users/{clerkUserId}/preferences:
 *   put:
 *     summary: Update user musical preferences (favorite genres/artists)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: clerkUserId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               favoriteGenres:
 *                 type: array
 *                 items:
 *                   type: string
 *               favoriteArtists:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Preferences updated
 */
router.put('/:clerkUserId/preferences', authenticate, userProfileController.updatePreferences);

/**
 * @swagger
 * /users/{clerkUserId}/history:
 *   get:
 *     summary: Get recently listened songs history
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: clerkUserId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Listening history array
 */
router.get('/:clerkUserId/history', authenticate, userProfileController.getListeningHistory);

/**
 * @swagger
 * /users/{clerkUserId}/history:
 *   post:
 *     summary: Add a song to listening history
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: clerkUserId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               songId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Added to history
 */
router.post('/:clerkUserId/history', authenticate, userProfileController.addToHistory);

/**
 * @swagger
 * /users/{clerkUserId}/internal/preferences:
 *   get:
 *     summary: Internal endpoint for recommendation engine to fetch user preferences
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: clerkUserId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User preferences
 */
router.get('/:clerkUserId/internal/preferences', authenticate, userProfileController.getUserPreferences);

module.exports = router;
