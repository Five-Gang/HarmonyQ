const playlistService = require('../services/playlistService');

class PlaylistController {
  async getAllPlaylistsAdmin(req, res, next) {
    try {
      const { page, limit, search, isPublic, isActive, sortBy, sortOrder } = req.query;
      const result = await playlistService.getAllPlaylistsAdmin({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search: search || '',
        isPublic: isPublic ? isPublic === 'true' : undefined,
        isActive: isActive ? isActive === 'true' : undefined,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc',
      });
      res.status(200).json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  // Admin moderation endpoint
  async setPlaylistStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive, isPublic } = req.body;
      const result = await playlistService.setPlaylistStatus(id, { isActive, isPublic });
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

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

  async getPublicPlaylists(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await playlistService.getPublicPlaylists(req.auth.userId, { page, limit });
      res.status(200).json({ success: true, ...result });
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

  async followPlaylist(req, res, next) {
    try {
      const result = await playlistService.followPlaylist(req.params.id, req.auth.userId);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async unfollowPlaylist(req, res, next) {
    try {
      const result = await playlistService.unfollowPlaylist(req.params.id, req.auth.userId);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async getFollowingPlaylists(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await playlistService.getFollowingPlaylists(req.auth.userId, { page, limit });
      res.status(200).json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async deletePlaylistPermanently(req, res, next) {
    try {
      const isAdmin = req.auth?.roles?.includes('admin') || false;
      const result = await playlistService.deletePlaylistPermanently(
        req.params.id,
        req.auth.userId,
        isAdmin
      );
      res.status(200).json({ success: true, ...result });
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
