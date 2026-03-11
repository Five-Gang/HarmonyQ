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

// Public read endpoints
router.get('/', getSongsValidation, validate, songController.getAllSongs);
router.get('/trending', songController.getTrendingSongs);
router.get('/:id', idParamValidation, validate, songController.getSongById);

// Internal endpoints (used by other microservices, but still authenticated)
router.post('/batch', authenticate, songController.getSongsByIds);
router.post('/by-genres', authenticate, songController.getSongsByGenres);
router.post('/:id/play', authenticate, songController.incrementPlayCount);

// Admin-only endpoints
router.post('/', authenticate, requireAdmin, createSongValidation, validate, songController.createSong);
router.put('/:id', authenticate, requireAdmin, idParamValidation, updateSongValidation, validate, songController.updateSong);
router.delete('/:id', authenticate, requireAdmin, idParamValidation, validate, songController.deleteSong);

module.exports = router;
