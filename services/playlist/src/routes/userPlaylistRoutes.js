const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');
const { authenticate } = require('../middleware/auth');

router.get('/:clerkUserId/playlists', authenticate, playlistController.getUserPlaylists);
// Internal route for Recommendation Service
router.get('/:clerkUserId/playlists/song-ids', authenticate, playlistController.getUserPlaylistSongIds);

module.exports = router;
