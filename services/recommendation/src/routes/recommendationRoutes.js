const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Recommendations
 *   description: Personalized music recommendations
 */

/**
 * @swagger
 * /recommendations/trending:
 *   get:
 *     summary: Get trending songs for discovery
 *     tags: [Recommendations]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of songs to return
 *     responses:
 *       200:
 *         description: Array of trending songs
 */
router.get('/trending/all', authenticate, recommendationController.getTrendingSongs);

/**
 * @swagger
 * /recommendations/genre:
 *   get:
 *     summary: Get recommendations filtered by genres
 *     tags: [Recommendations]
 *     parameters:
 *       - in: query
 *         name: genres
 *         required: true
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Genre(s) to filter by
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Array of songs in specified genres
 */
router.get('/genre/:clerkUserId', authenticate, recommendationController.getRecommendationsByGenre);

/**
 * @swagger
 * /recommendations/similar/{songId}:
 *   get:
 *     summary: Get songs similar to a specific song
 *     tags: [Recommendations]
 *     parameters:
 *       - in: path
 *         name: songId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Array of similar songs
 */
router.get('/similar/:songId', authenticate, recommendationController.getSimilarSongs);

/**
 * @swagger
 * /recommendations/{clerkUserId}/preferences:
 *   get:
 *     summary: Get user preferences that affect recommendations
 *     tags: [Recommendations]
 *     parameters:
 *       - in: path
 *         name: clerkUserId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User preference data
 */
router.get('/:clerkUserId/preferences', authenticate, recommendationController.getUserPreferences);

/**
 * @swagger
 * /recommendations/{clerkUserId}:
 *   get:
 *     summary: Get personalized song recommendations for a user
 *     tags: [Recommendations]
 *     parameters:
 *       - in: path
 *         name: clerkUserId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of recommended songs
 */
router.get('/:clerkUserId', authenticate, recommendationController.getRecommendations);

module.exports = router;
