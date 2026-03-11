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
