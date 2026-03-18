const songService = require('../services/songService');
const logger = require('../config/logger');
const { uploadToCloudinary } = require('../config/cloudinary');
const { uploadToAzure } = require('../config/azure');

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
        try {
          const result = await uploadToCloudinary(coverFile.buffer, 'image', 'covers');
          coverUrl = result.secure_url;
        } catch (uploadErr) {
          logger.warn('Cloudinary cover upload failed — song will be saved without a cover image. Check CLOUDINARY_API_SECRET.', {
            error: uploadErr.message,
          });
        }
      }

      // 2. Upload MP3 to Azure Blob Storage if provided
      if (req.files && req.files.audioFile && req.files.audioFile[0]) {
        const audioFile = req.files.audioFile[0];
        try {
          songUrl = await uploadToAzure(
            audioFile.buffer,
            audioFile.originalname,
            'songs',
            audioFile.mimetype
          );
        } catch (uploadErr) {
          logger.warn('Azure audio upload failed — song will be saved without a songUrl. Configure AZURE_STORAGE_CONNECTION_STRING to enable uploads.', {
            error: uploadErr.message,
          });
        }
      }

      // Build song payload
      const songData = {
        ...req.body,
        coverUrl: coverUrl,
        songUrl: songUrl,
      };

      // genre is sent as a plain string from the select dropdown.
      // Handle edge case where someone JSON-stringified it (e.g. '["Pop"]' → 'Pop').
      if (typeof songData.genre === 'string') {
        try {
          const parsed = JSON.parse(songData.genre);
          // If it parsed into an array, take the first element
          songData.genre = Array.isArray(parsed) ? parsed[0] : parsed;
        } catch (e) {
          // It's already a plain string like 'Pop' — keep it as-is
        }
      } else if (Array.isArray(songData.genre)) {
        // Shouldn't happen from this form, but be safe
        songData.genre = songData.genre[0];
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
