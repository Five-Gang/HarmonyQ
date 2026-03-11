const songService = require('../services/songService');
const logger = require('../config/logger');
const { uploadToCloudinary } = require('../config/cloudinary');
const { uploadToGCS } = require('../config/gcs');

class SongController {
  /**
   * GET /songs
   */
  async getAllSongs(req, res, next) {
    try {
      const { page, limit, genre, artist, album, search, sortBy, sortOrder } = req.query;
      const result = await songService.getSongs({ page, limit, genre, artist, album, search, sortBy, sortOrder });

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /songs/:id
   */
  async getSongById(req, res, next) {
    try {
      const song = await songService.getSongById(req.params.id);
      res.status(200).json({ success: true, data: song });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /songs/batch (internal endpoint used by other services)
   */
  async getSongsByIds(req, res, next) {
    try {
      const { ids } = req.body;
      const songs = await songService.getSongsByIds(ids);
      res.status(200).json({ success: true, data: songs });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /songs (admin only)
   */
  async createSong(req, res, next) {
    try {
      let coverUrl = req.body.coverUrl;
      let songUrl = req.body.songUrl;

      // 1. Upload cover image to Cloudinary if provided
      if (req.files && req.files.coverImage && req.files.coverImage[0]) {
        const coverFile = req.files.coverImage[0];
        const result = await uploadToCloudinary(coverFile.buffer, 'image', 'covers');
        coverUrl = result.secure_url;
      }

      // 2. Upload MP3 to Google Cloud Storage if provided
      if (req.files && req.files.audioFile && req.files.audioFile[0]) {
        const audioFile = req.files.audioFile[0];
        
        // Ensure GCS bucket env var is set, or it will use default
        songUrl = await uploadToGCS(
          audioFile.buffer,
          audioFile.originalname,
          'songs',
          audioFile.mimetype
        );
      }

      // Build song payload
      const songData = {
        ...req.body,
        coverUrl: coverUrl,
        songUrl: songUrl,
      };

      // Since the frontend sends 'genre' as a string in formData when multiple, parse array if it's a string
      if (typeof songData.genre === 'string') {
        try {
          songData.genre = JSON.parse(songData.genre);
        } catch (e) {
          songData.genre = [songData.genre];
        }
      }

      const song = await songService.createSong(songData);
      res.status(201).json({ success: true, data: song, message: 'Song created successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /songs/:id (admin only)
   */
  async updateSong(req, res, next) {
    try {
      const song = await songService.updateSong(req.params.id, req.body);
      res.status(200).json({ success: true, data: song, message: 'Song updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /songs/:id (admin only)
   */
  async deleteSong(req, res, next) {
    try {
      const result = await songService.deleteSong(req.params.id);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /songs/trending
   */
  async getTrendingSongs(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const songs = await songService.getTrendingSongs(limit);
      res.status(200).json({ success: true, data: songs });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /songs/by-genres (internal endpoint)
   */
  async getSongsByGenres(req, res, next) {
    try {
      const { genres, limit } = req.body;
      const songs = await songService.getSongsByGenres(genres, limit);
      res.status(200).json({ success: true, data: songs });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /songs/:id/play (increment play count)
   */
  async incrementPlayCount(req, res, next) {
    try {
      await songService.incrementPlayCount(req.params.id);
      res.status(200).json({ success: true, message: 'Play count updated' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SongController();
