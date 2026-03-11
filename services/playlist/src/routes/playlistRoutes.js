const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');
const { authenticate } = require('../middleware/auth');

// Public access to specific playlists (handles private in service layer)
router.get('/:id', authenticate, playlistController.getPlaylistById);

// Protected playlist management
router.post('/', authenticate, playlistController.createPlaylist);
router.put('/:id', authenticate, playlistController.updatePlaylist);
router.delete('/:id', authenticate, playlistController.deletePlaylist);

// Song management
router.post('/:id/songs', authenticate, playlistController.addSongs);
router.delete('/:id/songs/:songId', authenticate, playlistController.removeSong);
router.put('/:id/songs/reorder', authenticate, playlistController.reorderSongs);

module.exports = router;
