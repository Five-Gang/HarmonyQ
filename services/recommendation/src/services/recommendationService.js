const axios = require('axios');
const logger = require('../config/logger');

const SONG_CATALOG_URL = process.env.SONG_CATALOG_URL || 'http://localhost:3001';
const USER_PROFILE_URL = process.env.USER_PROFILE_URL || 'http://localhost:3002';
const PLAYLIST_URL = process.env.PLAYLIST_URL || 'http://localhost:3003';

const makeRequest = async (url, method = 'get', data = null, token) => {
  try {
    const response = await axios({
      method,
      url,
      data,
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000,
    });
    return response.data;
  } catch (error) {
    logger.warn(`Service call failed: ${url}`, { error: error.message });
    return null;
  }
};

class RecommendationService {
  /**
   * Main recommendation engine
   */
  async getRecommendations(clerkUserId, authToken) {
    // Fetch data from all services in parallel
    const [profileData, playlistSongIds, trendingData] = await Promise.all([
      makeRequest(`${USER_PROFILE_URL}/users/${clerkUserId}/internal/preferences`, 'get', null, authToken),
      makeRequest(`${PLAYLIST_URL}/users/${clerkUserId}/playlists/song-ids`, 'get', null, authToken),
      makeRequest(`${SONG_CATALOG_URL}/songs/trending?limit=20`, 'get', null, authToken),
    ]);

    const preferences = profileData?.data?.preferences || {};
    const recentSongIds = profileData?.data?.recentSongIds || [];
    const playlistIds = playlistSongIds?.data || [];
    const trendingSongs = trendingData?.data || [];

    const allListenedIds = new Set([...recentSongIds, ...playlistIds]);

    let recommendations = [];

    // Strategy 1: Genre-based recommendations
    if (preferences.favoriteGenres?.length > 0) {
      const genreData = await makeRequest(
        `${SONG_CATALOG_URL}/songs/by-genres`,
        'post',
        { genres: preferences.favoriteGenres, limit: 30 },
        authToken
      );
      if (genreData?.data) {
        recommendations.push(...genreData.data.map((s) => ({ ...s, source: 'genre', score: 10 })));
      }
    }

    // Strategy 2: Filter trending songs (exclude already heard)
    const freshTrending = trendingSongs
      .filter((s) => !allListenedIds.has(s._id?.toString()))
      .map((s) => ({ ...s, source: 'trending', score: 5 }));
    recommendations.push(...freshTrending);

    // Strategy 3: New releases from liked genres
    if (preferences.favoriteGenres?.length > 0) {
      const genreSongs = recommendations.filter(s => preferences.favoriteGenres.includes(s.genre));
      genreSongs.forEach(s => { s.score += 3; });
    }

    // De-duplicate by song ID
    const seen = new Set();
    const deduplicated = recommendations.filter((s) => {
      const id = s._id?.toString();
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    // Exclude already listened songs
    const filtered = deduplicated.filter((s) => !allListenedIds.has(s._id?.toString()));

    // Sort by score desc, then playCount
    filtered.sort((a, b) => b.score - a.score || b.playCount - a.playCount);

    const finalRecommendations = filtered.slice(0, 20);

    // Fallback: if no personalized results, return trending
    if (finalRecommendations.length < 5) {
      return {
        recommendations: trendingSongs.slice(0, 20),
        strategy: 'trending_fallback',
        personalized: false,
      };
    }

    return {
      recommendations: finalRecommendations,
      strategy: 'personalized',
      personalized: true,
      basedOn: {
        genres: preferences.favoriteGenres || [],
        recentListens: recentSongIds.length,
        playlistSongs: playlistIds.length,
      },
    };
  }
}

module.exports = new RecommendationService();
