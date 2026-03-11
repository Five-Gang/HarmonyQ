const playlistService = require('../services/playlistService');

class PlaylistController {
  async createPlaylist(req, res, next) {
    try {
      const authToken = req.headers.authorization?.split(' ')[1];
      const playlist = await playlistService.createPlaylist(
        { ...req.body, clerkUserId: req.auth.userId },
        authToken
      );
      res.status(201).json({ success: true, data: playlist, message: 'Playlist created' });
    } catch (error) { next(error); }
  }

  async getPlaylistById(req, res, next) {
    try {
      const playlist = await playlistService.getPlaylistById(req.params.id, req.auth?.userId);
      res.status(200).json({ success: true, data: playlist });
    } catch (error) { next(error); }
  }

  async getUserPlaylists(req, res, next) {
    try {
      const { clerkUserId } = req.params;
      const { page, limit } = req.query;
      const result = await playlistService.getUserPlaylists(clerkUserId, req.auth.userId, { page, limit });
      res.status(200).json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async updatePlaylist(req, res, next) {
    try {
      const playlist = await playlistService.updatePlaylist(req.params.id, req.auth.userId, req.body);
      res.status(200).json({ success: true, data: playlist });
    } catch (error) { next(error); }
  }

  async deletePlaylist(req, res, next) {
    try {
      const result = await playlistService.deletePlaylist(req.params.id, req.auth.userId);
      res.status(200).json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async addSongs(req, res, next) {
    try {
      const authToken = req.headers.authorization?.split(' ')[1];
      const playlist = await playlistService.addSongs(req.params.id, req.auth.userId, req.body.songIds, authToken);
      res.status(200).json({ success: true, data: playlist });
    } catch (error) { next(error); }
  }

  async removeSong(req, res, next) {
    try {
      const playlist = await playlistService.removeSong(req.params.id, req.auth.userId, req.params.songId);
      res.status(200).json({ success: true, data: playlist });
    } catch (error) { next(error); }
  }

  async reorderSongs(req, res, next) {
    try {
      const playlist = await playlistService.reorderSongs(req.params.id, req.auth.userId, req.body.songIds);
      res.status(200).json({ success: true, data: playlist });
    } catch (error) { next(error); }
  }

  // Internal endpoint for Recommendation Service
  async getUserPlaylistSongIds(req, res, next) {
    try {
      const ids = await playlistService.getUserPlaylistSongIds(req.params.clerkUserId);
      res.status(200).json({ success: true, data: ids });
    } catch (error) { next(error); }
  }
}

module.exports = new PlaylistController();
