const express = require('express');
const router = express.Router();
const songController = require('../controllers/songController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');
const {
  createSongValidation,
  updateSongValidation,
  idParamValidation,
  getSongsValidation,
} = require('../middleware/validators');
const { upload } = require('../middleware/uploadMiddleware');

/**
 * @swagger
 * tags:
 *   name: Songs
 *   description: Song management and retrieval
 */

/**
 * @swagger
 * /songs:
 *   get:
 *     summary: Get all songs
 *     tags: [Songs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of songs
 */
router.get('/', getSongsValidation, validate, songController.getAllSongs);

/**
 * @swagger
 * /songs/trending:
 *   get:
 *     summary: Get trending songs
 *     tags: [Songs]
 *     responses:
 *       200:
 *         description: Trending songs based on play count
 */
router.get('/trending', songController.getTrendingSongs);

/**
 * @swagger
 * /songs/{id}:
 *   get:
 *     summary: Get a specific song by ID
 *     tags: [Songs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Song details
 */
router.get('/:id', idParamValidation, validate, songController.getSongById);

// Internal endpoints (used by other microservices, but still authenticated)

/**
 * @swagger
 * /songs/batch:
 *   post:
 *     summary: Get multiple songs by their IDs
 *     tags: [Songs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Returns an array of songs
 */
router.post('/batch', authenticate, songController.getSongsByIds);

/**
 * @swagger
 * /songs/by-genres:
 *   post:
 *     summary: Get multiple songs matching given genres
 *     tags: [Songs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               genres:
 *                 type: array
 *                 items:
 *                   type: string
 *               limit:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Array of songs
 */
router.post('/by-genres', authenticate, songController.getSongsByGenres);

/**
 * @swagger
 * /songs/{id}/play:
 *   post:
 *     summary: Increment play count for a song
 *     tags: [Songs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Play count incremented
 */
router.post('/:id/play', authenticate, songController.incrementPlayCount);

// Admin-only endpoints

/**
 * @swagger
 * /songs:
 *   post:
 *     summary: Create a newly uploaded song (Admin only)
 *     tags: [Songs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               artist:
 *                 type: string
 *               album:
 *                 type: string
 *               duration:
 *                 type: number
 *               genre:
 *                 type: array
 *                 items:
 *                   type: string
 *               songUrl:
 *                 type: string
 *               coverUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created song
 */
router.post(
  '/', 
  authenticate, 
  requireAdmin, 
  upload.fields([{ name: 'audioFile', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]), 
  createSongValidation, 
  validate, 
  songController.createSong
);

/**
 * @swagger
 * /songs/{id}:
 *   put:
 *     summary: Update a song (Admin only)
 *     tags: [Songs]
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
 *         description: Updated song
 */
router.put('/:id', authenticate, requireAdmin, idParamValidation, updateSongValidation, validate, songController.updateSong);

/**
 * @swagger
 * /songs/{id}:
 *   delete:
 *     summary: Delete a song (Admin only)
 *     tags: [Songs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Song deleted
 */
router.delete('/:id', authenticate, requireAdmin, idParamValidation, validate, songController.deleteSong);

module.exports = router;
