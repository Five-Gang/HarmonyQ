const Playlist = require('../models/Playlist');
const { validateSongIds } = require('../utils/songValidator');
const logger = require('../config/logger');

class PlaylistService {
  /**
   * Create a new playlist
   */
  async createPlaylist({ clerkUserId, name, description, isPublic, tags, coverImage, songIds = [] }, authToken) {
    let validatedSongIds = [];
    if (songIds.length > 0) {
      validatedSongIds = await validateSongIds(songIds, authToken);
    }

    const playlist = await Playlist.create({
      clerkUserId,
      name,
      description,
      isPublic,
      tags,
      coverImage,
      songIds: validatedSongIds,
    });

    logger.info('Playlist created', { playlistId: playlist._id, clerkUserId });
    return playlist;
  }

  /**
   * Get a playlist by ID (with access control)
   */
  async getPlaylistById(id, requestingUserId) {
    const playlist = await Playlist.findOne({ _id: id, isActive: true }).lean();

    if (!playlist) {
      const err = new Error('Playlist not found');
      err.statusCode = 404;
      throw err;
    }

    if (!playlist.isPublic && playlist.clerkUserId !== requestingUserId) {
      const err = new Error('This playlist is private');
      err.statusCode = 403;
      throw err;
    }

    // Add isFollowing flag
    const isFollowing = playlist.followers?.includes(requestingUserId) || false;

    return { ...playlist, isFollowing };
  }

  /**
   * Get all playlists for a user
   */
  async getUserPlaylists(clerkUserId, requestingUserId, { page = 1, limit = 20 } = {}) {
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const query = { clerkUserId, isActive: true };
    // If requesting someone else's playlists, only show public ones
    if (clerkUserId !== requestingUserId) {
      query.isPublic = true;
    }

    const [playlists, total] = await Promise.all([
      Playlist.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limitNum).lean(),
      Playlist.countDocuments(query),
    ]);

    // Add isFollowing flag to each playlist
    const playlistsWithFlag = playlists.map(p => ({ 
      ...p, 
      isFollowing: p.followers?.includes(requestingUserId) || false 
    }));

    return {
      playlists: playlistsWithFlag,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    };
  }

  /**
   * Get all public playlists (browse all public playlists)
   */
  async getPublicPlaylists(clerkUserId, { page = 1, limit = 20 } = {}) {
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const query = { isPublic: true, isActive: true };

    const [playlists, total] = await Promise.all([
      Playlist.find(query).sort({ followerCount: -1, updatedAt: -1 }).skip(skip).limit(limitNum).lean(),
      Playlist.countDocuments(query),
    ]);

    // Add isFollowing flag to each playlist
    const playlistsWithFlag = playlists.map(p => ({ 
      ...p, 
      isFollowing: p.followers?.includes(clerkUserId) || false 
    }));

    return {
      playlists: playlistsWithFlag,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    };
  }

  /**
   * Update playlist metadata
   */
  async updatePlaylist(id, clerkUserId, updates) {
    const playlist = await Playlist.findOne({ _id: id, isActive: true });
    if (!playlist) {
      const err = new Error('Playlist not found');
      err.statusCode = 404;
      throw err;
    }
    if (playlist.clerkUserId !== clerkUserId) {
      const err = new Error('You do not own this playlist');
      err.statusCode = 403;
      throw err;
    }

    const allowedFields = ['name', 'description', 'isPublic', 'tags', 'coverImage'];
    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) playlist[field] = updates[field];
    });

    await playlist.save();
    logger.info('Playlist updated', { playlistId: id });
    return playlist.toJSON();
  }

  /**
   * Delete a playlist (soft delete)
   */
  async deletePlaylist(id, clerkUserId) {
    const playlist = await Playlist.findOne({ _id: id, isActive: true });
    if (!playlist) {
      const err = new Error('Playlist not found');
      err.statusCode = 404;
      throw err;
    }
    if (playlist.clerkUserId !== clerkUserId) {
      const err = new Error('You do not own this playlist');
      err.statusCode = 403;
      throw err;
    }

    playlist.isActive = false;
    await playlist.save();
    logger.info('Playlist deleted', { playlistId: id });
    return { message: 'Playlist deleted successfully' };
  }

  /**
   * Add songs to playlist
   */
  async addSongs(id, clerkUserId, songIds, authToken) {
    const playlist = await Playlist.findOne({ _id: id, isActive: true });
    if (!playlist) {
      const err = new Error('Playlist not found');
      err.statusCode = 404;
      throw err;
    }
    if (playlist.clerkUserId !== clerkUserId) {
      const err = new Error('You do not own this playlist');
      err.statusCode = 403;
      throw err;
    }

    const validIds = await validateSongIds(songIds, authToken);
    const newIds = validIds.filter((id) => !playlist.songIds.includes(id));
    playlist.songIds.push(...newIds);

    if (playlist.songIds.length > 500) {
      const err = new Error('Playlist cannot exceed 500 songs');
      err.statusCode = 400;
      throw err;
    }

    await playlist.save();
    return playlist.toJSON();
  }

  /**
   * Remove a song from playlist
   */
  async removeSong(id, clerkUserId, songId) {
    const playlist = await Playlist.findOne({ _id: id, isActive: true });
    if (!playlist) {
      const err = new Error('Playlist not found');
      err.statusCode = 404;
      throw err;
    }
    if (playlist.clerkUserId !== clerkUserId) {
      const err = new Error('You do not own this playlist');
      err.statusCode = 403;
      throw err;
    }

    playlist.songIds = playlist.songIds.filter((s) => s !== songId);
    await playlist.save();
    return playlist.toJSON();
  }

  /**
   * Reorder songs in a playlist
   */
  async reorderSongs(id, clerkUserId, newOrder) {
    const playlist = await Playlist.findOne({ _id: id, isActive: true });
    if (!playlist) {
      const err = new Error('Playlist not found'); err.statusCode = 404; throw err;
    }
    if (playlist.clerkUserId !== clerkUserId) {
      const err = new Error('You do not own this playlist'); err.statusCode = 403; throw err;
    }

    // Validate new order contains same IDs
    const currentSet = new Set(playlist.songIds);
    const newSet = new Set(newOrder);
    if (currentSet.size !== newSet.size || [...currentSet].some((id) => !newSet.has(id))) {
      const err = new Error('Reorder must contain the same song IDs'); err.statusCode = 400; throw err;
    }

    playlist.songIds = newOrder;
    await playlist.save();
    return playlist.toJSON();
  }

  /**
   * Get playlist song IDs (used by Recommendation Service)
   */
  async getUserPlaylistSongIds(clerkUserId) {
    const playlists = await Playlist.find({ clerkUserId, isActive: true }).select('songIds').lean();
    const allIds = [...new Set(playlists.flatMap((p) => p.songIds))];
    return allIds;
  }

  /**
   * Set playlist status (admin moderation)
   */
  async setPlaylistStatus(id, { isActive, isPublic }) {
    const playlist = await Playlist.findById(id);
    if (!playlist) {
      const err = new Error('Playlist not found');
      err.statusCode = 404;
      throw err;
    }

    if (isActive !== undefined) {
      playlist.isActive = isActive;
    }
    if (isPublic !== undefined) {
      playlist.isPublic = isPublic;
    }

    await playlist.save();
    logger.info('Playlist status updated (admin)', { playlistId: id, isActive, isPublic });
    return playlist.toJSON();
  }

  /**
   * Get all playlists (admin endpoint - includes all public + private)
   */
  async getAllPlaylistsAdmin({
    page = 1,
    limit = 10,
    search = '',
    isPublic = undefined,
    isActive = undefined,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = {}) {
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};

    // Filter by search (name or owner ID)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { clerkUserId: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by public/private status
    if (isPublic !== undefined) {
      query.isPublic = isPublic;
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    // Build sort object
    const sort = {};
    const validSortFields = ['createdAt', 'updatedAt', 'name', 'followerCount', 'songCount'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    sort[sortField] = sortOrder === 'asc' ? 1 : -1;

    const [playlists, total] = await Promise.all([
      Playlist.find(query).sort(sort).skip(skip).limit(limitNum).lean(),
      Playlist.countDocuments(query),
    ]);

    return {
      playlists,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    };
  }

  async followPlaylist(playlistId, clerkUserId) {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new Error('Playlist not found');
    }

    // Check if already following
    if (playlist.followers.includes(clerkUserId)) {
      throw new Error('Already following this playlist');
    }

    // Add user to followers
    playlist.followers.push(clerkUserId);
    playlist.followerCount += 1;
    await playlist.save();

    return { success: true, followerCount: playlist.followerCount };
  }

  /**
   * Permanently delete a playlist (admin or owner)
   */
  async deletePlaylistPermanently(id, requestingUserId, isAdmin = false) {
    const playlist = await Playlist.findById(id);
    if (!playlist) {
      const err = new Error('Playlist not found');
      err.statusCode = 404;
      throw err;
    }

    // Check if user is owner or admin
    if (playlist.clerkUserId !== requestingUserId && !isAdmin) {
      const err = new Error('Only the owner or an admin can delete this playlist');
      err.statusCode = 403;
      throw err;
    }

    await Playlist.deleteOne({ _id: id });
    logger.info('Playlist permanently deleted', { playlistId: id, deletedBy: requestingUserId, isAdmin });
    return { message: 'Playlist permanently deleted' };
  }

  async getFollowingPlaylists(clerkUserId, { page = 1, limit = 20 } = {}) {
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const query = { 
      followers: clerkUserId,
      isActive: true,
      isPublic: true 
    };

    const [playlists, total] = await Promise.all([
      Playlist.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limitNum).lean(),
      Playlist.countDocuments(query),
    ]);

    // Add isFollowing flag to all playlists (will be true for all since we filtered by followers array)
    const playlistsWithFlag = playlists.map(p => ({ ...p, isFollowing: true }));

    return {
      playlists: playlistsWithFlag,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    };
  }

  async unfollowPlaylist(playlistId, clerkUserId) {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new Error('Playlist not found');
    }

    // Check if following
    if (!playlist.followers.includes(clerkUserId)) {
      throw new Error('Not following this playlist');
    }

    // Remove user from followers
    playlist.followers = playlist.followers.filter(id => id !== clerkUserId);
    playlist.followerCount = Math.max(0, playlist.followerCount - 1);
    await playlist.save();

    return { success: true, followerCount: playlist.followerCount };
  }
}

module.exports = new PlaylistService();
