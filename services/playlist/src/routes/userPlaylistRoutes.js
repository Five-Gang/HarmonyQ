const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: UserPlaylists
 *   description: User specific playlists retrieval
 */

/**
 * @swagger
 * /users/{clerkUserId}/playlists:
 *   get:
 *     summary: Get all playlists for a specific user
 *     tags: [UserPlaylists]
 *     parameters:
 *       - in: path
 *         name: clerkUserId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of playlists
 */
router.get('/:clerkUserId/playlists', authenticate, playlistController.getUserPlaylists);

/**
 * @swagger
 * /users/{clerkUserId}/playlists/song-ids:
 *   get:
 *     summary: Internal endpoint to fetch all song IDs present in user's playlists
 *     tags: [UserPlaylists]
 *     parameters:
 *       - in: path
 *         name: clerkUserId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of song object IDs
 */
router.get('/:clerkUserId/playlists/song-ids', authenticate, playlistController.getUserPlaylistSongIds);

module.exports = router;
