const mongoose = require('mongoose');
const Song = require('../models/Song');
const logger = require('../config/logger');

/**
 * Escape special regex characters so user-supplied strings
 * cannot inject arbitrary patterns into a RegExp query.
 * This prevents the jsecurity:S5147 NoSQL-injection finding.
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class SongService {
  /**
   * Get all songs with filtering, searching, pagination, and sorting
   */
  async getSongs({ page = 1, limit = 20, genre, artist, album, search, sortBy = 'createdAt', sortOrder = 'desc' }) {
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const query = { isActive: true };

    // Validate genre against the schema enum — avoids injecting arbitrary values
    const ALLOWED_GENRES = [
      'Pop', 'Rock', 'Hip-Hop', 'R&B', 'Jazz', 'Classical',
      'Electronic', 'Country', 'Latin', 'Reggae', 'Blues',
      'Folk', 'Indie', 'Metal', 'Punk', 'Soul', 'Funk',
      'Alternative', 'K-Pop', 'Other',
    ];
    if (genre && ALLOWED_GENRES.includes(genre)) query.genre = genre;

    // Escape user-supplied strings before using in RegExp to prevent NoSQL injection
    if (artist) query.artist = new RegExp(escapeRegex(String(artist)), 'i');
    if (album) query.album = new RegExp(escapeRegex(String(album)), 'i');

    // Full-text search — MongoDB's $text operator handles the string safely
    if (search) {
      query.$text = { $search: String(search) };
    }

    // Allowlist sortBy to prevent prototype-pollution / injection through dynamic key names
    const ALLOWED_SORT_FIELDS = ['title', 'artist', 'genre', 'releaseYear', 'playCount', 'createdAt'];
    const safeSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
    const sortOptions = {};
    sortOptions[safeSortBy] = sortOrder === 'asc' ? 1 : -1;

    const [songs, total] = await Promise.all([
      Song.find(query).sort(sortOptions).skip(skip).limit(limitNum).lean(),
      Song.countDocuments(query),
    ]);

    return {
      songs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
    };
  }

  /**
   * Get a single song by ID
   */
  async getSongById(id) {
    const song = await Song.findOne({ _id: id, isActive: true }).lean();
    if (!song) {
      const err = new Error('Song not found');
      err.statusCode = 404;
      throw err;
    }
    return song;
  }

  /**
   * Get songs by array of IDs (used by Playlist and Recommendation services)
   * IDs are validated as proper MongoDB ObjectIds to prevent NoSQL injection (jsecurity:S5147)
   */
  async getSongsByIds(ids) {
    // Only pass values that are valid MongoDB ObjectIds — rejects any injected operator objects
    const safeIds = (Array.isArray(ids) ? ids : [])
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(String(id)));
    if (safeIds.length === 0) return [];
    return Song.find({ _id: { $in: safeIds }, isActive: true }).lean();
  }

  /**
   * Create a new song
   */
  async createSong(data) {
    const song = await Song.create(data);
    logger.info('Song created', { songId: song._id, title: song.title });
    return song;
  }

  /**
   * Update an existing song
   */
  async updateSong(id, data) {
    const song = await Song.findOneAndUpdate(
      { _id: id, isActive: true },
      { $set: data },
      { new: true, runValidators: true }
    ).lean();

    if (!song) {
      const err = new Error('Song not found');
      err.statusCode = 404;
      throw err;
    }

    logger.info('Song updated', { songId: id });
    return song;
  }

  /**
   * Soft-delete a song
   */
  async deleteSong(id) {
    const song = await Song.findOneAndUpdate(
      { _id: id, isActive: true },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!song) {
      const err = new Error('Song not found');
      err.statusCode = 404;
      throw err;
    }

    logger.info('Song deleted (soft)', { songId: id });
    return { message: 'Song deleted successfully' };
  }

  /**
   * Get trending songs by play count
   */
  async getTrendingSongs(limit = 10) {
    return Song.find({ isActive: true })
      .sort({ playCount: -1, createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Get songs by genre for recommendations
   */
  async getSongsByGenres(genres, limit = 20) {
    // Validate every genre against the schema allowlist before passing to $in
    // This prevents NoSQL injection via user-controlled arrays (jsecurity:S5147)
    const ALLOWED_GENRES = [
      'Pop', 'Rock', 'Hip-Hop', 'R&B', 'Jazz', 'Classical',
      'Electronic', 'Country', 'Latin', 'Reggae', 'Blues',
      'Folk', 'Indie', 'Metal', 'Punk', 'Soul', 'Funk',
      'Alternative', 'K-Pop', 'Other',
    ];
    const safeGenres = (Array.isArray(genres) ? genres : [])
      .filter((g) => typeof g === 'string' && ALLOWED_GENRES.includes(g));
    if (safeGenres.length === 0) return [];
    return Song.find({ genre: { $in: safeGenres }, isActive: true })
      .sort({ playCount: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Increment play count
   */
  async incrementPlayCount(id) {
    await Song.findByIdAndUpdate(id, { $inc: { playCount: 1 } });
  }
}

module.exports = new SongService();
