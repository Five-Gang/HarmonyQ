const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Playlists
 *   description: Playlist management and retrieval
 */

/**
 * @swagger
 * /playlists/public/browse:
 *   get:
 *     summary: Get all public playlists (browsable)
 *     tags: [Playlists]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Array of public playlists
 */
router.get('/public/browse', authenticate, playlistController.getPublicPlaylists);

/**
 * @swagger
 * /playlists/{id}:
 *   get:
 *     summary: Get playlist by ID
 *     tags: [Playlists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Playlist details with populated songs
 */
router.get('/:id', authenticate, playlistController.getPlaylistById);

/**
 * @swagger
 * /playlists:
 *   post:
 *     summary: Create a new playlist
 *     tags: [Playlists]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Playlist created
 */
router.post('/', authenticate, playlistController.createPlaylist);

/**
 * @swagger
 * /playlists/{id}:
 *   put:
 *     summary: Update playlist details (e.g. name, visibility)
 *     tags: [Playlists]
 *     parameters:
 *       - in: path
 *         name: id
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
 *         description: Playlist updated
 */
router.put('/:id', authenticate, playlistController.updatePlaylist);

/**
 * @swagger
 * /playlists/{id}:
 *   delete:
 *     summary: Delete playlist
 *     tags: [Playlists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Playlist deleted
 */
router.delete('/:id', authenticate, playlistController.deletePlaylist);

/**
 * @swagger
 * /playlists/{id}/songs:
 *   post:
 *     summary: Add one or more songs to playlist
 *     tags: [Playlists]
 *     parameters:
 *       - in: path
 *         name: id
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
 *               songIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Songs added
 */
router.post('/:id/songs', authenticate, playlistController.addSongs);

/**
 * @swagger
 * /playlists/{id}/songs/{songId}:
 *   delete:
 *     summary: Remove a specific song from playlist
 *     tags: [Playlists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: songId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Song removed
 */
router.delete('/:id/songs/:songId', authenticate, playlistController.removeSong);

/**
 * @swagger
 * /playlists/{id}/songs/reorder:
 *   put:
 *     summary: Reorder songs in a playlist
 *     tags: [Playlists]
 *     parameters:
 *       - in: path
 *         name: id
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
 *               orderedSongIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Playlist order updated
 */
router.put('/:id/songs/reorder', authenticate, playlistController.reorderSongs);

module.exports = router;
