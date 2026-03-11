const Song = require('../models/Song');
const logger = require('../config/logger');

class SongService {
  /**
   * Get all songs with filtering, searching, pagination, and sorting
   */
  async getSongs({ page = 1, limit = 20, genre, artist, album, search, sortBy = 'createdAt', sortOrder = 'desc' }) {
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const query = { isActive: true };

    if (genre) query.genre = genre;
    if (artist) query.artist = new RegExp(artist, 'i');
    if (album) query.album = new RegExp(album, 'i');

    // Full-text search
    if (search) {
      query.$text = { $search: search };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

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
   */
  async getSongsByIds(ids) {
    return Song.find({ _id: { $in: ids }, isActive: true }).lean();
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
    return Song.find({ genre: { $in: genres }, isActive: true })
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
