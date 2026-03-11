const axios = require('axios');
const logger = require('../config/logger');

const SONG_CATALOG_URL = process.env.SONG_CATALOG_URL || 'http://localhost:3001';

/**
 * Validate that song IDs exist in Song Catalog Service
 * Returns valid song IDs only
 */
const validateSongIds = async (songIds, authToken) => {
  if (!songIds || songIds.length === 0) return [];

  try {
    const response = await axios.post(
      `${SONG_CATALOG_URL}/songs/batch`,
      { ids: songIds },
      {
        headers: { Authorization: `Bearer ${authToken}` },
        timeout: 5000,
      }
    );

    const validSongs = response.data.data || [];
    const validIds = validSongs.map((s) => s._id.toString());

    const invalid = songIds.filter((id) => !validIds.includes(id));
    if (invalid.length > 0) {
      logger.warn('Some song IDs are invalid', { invalidIds: invalid });
    }

    return validIds;
  } catch (error) {
    logger.error('Failed to validate songs with Song Catalog Service', { error: error.message });
    // Graceful degradation - allow IDs if service is unavailable
    return songIds;
  }
};

module.exports = { validateSongIds };
