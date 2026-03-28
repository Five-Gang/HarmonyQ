const axios = require('axios');
const http = require('http');
const https = require('https');
const logger = require('../config/logger');

const SONG_CATALOG_URL = process.env.SONG_CATALOG_URL || 'http://localhost:3001';
const USER_PROFILE_URL = process.env.USER_PROFILE_URL || 'http://localhost:3002';
const PLAYLIST_URL = process.env.PLAYLIST_URL || 'http://localhost:3003';

// Create axios instance with connection pooling and keep-alive
const axiosInstance = axios.create({
  httpAgent: new http.Agent({ keepAlive: true, timeout: 20000 }),
  httpsAgent: new https.Agent({ keepAlive: true, timeout: 20000 }),
  timeout: 15000,
});

const makeRequest = async (url, method = 'get', data = null, token) => {
  try {
    const response = await axiosInstance({
      method,
      url,
      data,
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const errorDetails = {
      error: error.message,
      code: error.code,
      status: error.response?.status,
      timeoutMillis: 15000,
    };
    
    if (error.code === 'ECONNREFUSED') {
      errorDetails.detail = 'Service unavailable - connection refused';
    } else if (error.code === 'ECONNABORTED') {
      errorDetails.detail = 'Service timeout';
    }
    
    logger.warn(`Service call failed: ${url}`, errorDetails);
    return null;
  }
};

class RecommendationService {
  /**
   * Main recommendation engine - prioritizes listening history
   */
  async getRecommendations(clerkUserId, authToken) {
    // Fetch data from all services in parallel
    const [profileData, playlistSongIds, trendingData, historyData] = await Promise.all([
      makeRequest(`${USER_PROFILE_URL}/users/${clerkUserId}/internal/preferences`, 'get', null, authToken),
      makeRequest(`${PLAYLIST_URL}/users/${clerkUserId}/playlists/song-ids`, 'get', null, authToken),
      makeRequest(`${SONG_CATALOG_URL}/songs/trending?limit=20`, 'get', null, authToken),
      makeRequest(`${USER_PROFILE_URL}/users/${clerkUserId}/history?limit=50&page=1`, 'get', null, authToken),
    ]);

    const preferences = profileData?.data?.preferences || {};
    const recentSongIds = profileData?.data?.recentSongIds || [];
    const playlistIds = playlistSongIds?.data || [];
    const trendingSongs = trendingData?.data || [];
    // Fix: access history instead of data
    const listeningHistory = historyData?.history || [];

    const allListenedIds = new Set([...recentSongIds, ...playlistIds]);
    
    let recommendations = [];

    // PRIORITY 1: Get songs similar to listening history (highest priority)
    if (listeningHistory.length > 0) {
      // Get the most recent listened song IDs
      const recentListenedIds = listeningHistory.slice(0, 20).map(item => item.songId);
      
      // Fetch full song details to get genres and artists
      const songDetailsData = await makeRequest(
        `${SONG_CATALOG_URL}/songs/by-ids`,
        'post',
        { ids: recentListenedIds },
        authToken
      );
      
      const listeningHistorySongs = songDetailsData?.data || [];
      const genresFromHistory = new Set();
      const artistsFromHistory = new Set();
      
      listeningHistorySongs.forEach(song => {
        if (song.genre) genresFromHistory.add(song.genre);
        if (song.artist) artistsFromHistory.add(song.artist);
      });

      // Fetch similar songs based on listening history genres
      if (genresFromHistory.size > 0) {
        const similarData = await makeRequest(
          `${SONG_CATALOG_URL}/songs/by-genres`,
          'post',
          { genres: Array.from(genresFromHistory), limit: 30 },
          authToken
        );
        if (similarData?.data) {
          // Give highest score to songs similar to listening history
          recommendations.push(...similarData.data.map((s) => ({ 
            ...s, 
            source: 'listening_history', 
            score: 20,
            reason: 'Based on your listening history'
          })));
        }
      }
    }

    // PRIORITY 2: Genre-based recommendations (using user preferences if set)
    if (preferences.favoriteGenres?.length > 0) {
      const genreData = await makeRequest(
        `${SONG_CATALOG_URL}/songs/by-genres`,
        'post',
        { genres: preferences.favoriteGenres, limit: 25 },
        authToken
      );
      if (genreData?.data) {
        recommendations.push(...genreData.data.map((s) => ({ 
          ...s, 
          source: 'genre', 
          score: 12,
          reason: 'Matches your favorite genres'
        })));
      }
    }

    // PRIORITY 3: Filter trending songs (exclude already heard)
    const freshTrending = trendingSongs
      .filter((s) => !allListenedIds.has(s._id?.toString()))
      .map((s) => ({ 
        ...s, 
        source: 'trending', 
        score: 5,
        reason: 'Trending this week'
      }));
    recommendations.push(...freshTrending);

    // PRIORITY 4: Boost score for songs matching both listening history AND favorite genres
    if (preferences.favoriteGenres?.length > 0 && listeningHistory.length > 0) {
      const genresFromHistory = new Set();
      listeningHistory.slice(0, 20).forEach(item => {
        if (item.genre) genresFromHistory.add(item.genre);
      });

      recommendations.forEach(song => {
        const matchesBoth = 
          preferences.favoriteGenres.includes(song.genre) && 
          genresFromHistory.has(song.genre);
        if (matchesBoth) {
          song.score += 8;
          song.reason = 'Matches your taste and listening history';
        }
      });
    }

    // De-duplicate by song ID (keep highest score version)
    const seen = new Map();
    recommendations.forEach((s) => {
      const id = s._id?.toString();
      if (!seen.has(id) || seen.get(id).score < s.score) {
        seen.set(id, s);
      }
    });
    const deduplicated = Array.from(seen.values());

    // Exclude already listened songs
    const filtered = deduplicated.filter((s) => !allListenedIds.has(s._id?.toString()));

    // Sort by score desc, then playCount, then by reason priority
    filtered.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.playCount !== a.playCount) return b.playCount - a.playCount;
      return 0;
    });

    const finalRecommendations = filtered.slice(0, 20);

    // Fallback: if no personalized results, return trending
    if (finalRecommendations.length < 5) {
      return {
        recommendations: trendingSongs.slice(0, 20),
        strategy: 'trending_fallback',
        personalized: false,
        basedOn: {
          genres: preferences.favoriteGenres || [],
          recentListens: recentSongIds.length,
          playlistSongs: playlistIds.length,
          listeningHistory: listeningHistory.length,
        },
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
        listeningHistory: listeningHistory.length,
      },
    };
  }

  /**
   * Get trending songs for discovery
   */
  async getTrendingSongs(limit = 20, authToken) {
    try {
      const trendingData = await makeRequest(
        `${SONG_CATALOG_URL}/songs/trending?limit=${limit}`,
        'get',
        null,
        authToken
      );
      return trendingData?.data || [];
    } catch (error) {
      logger.error('Error fetching trending songs:', error);
      return [];
    }
  }

  /**
   * Get recommendations filtered by genres - prioritizes listening history
   */
  async getRecommendationsByGenre(clerkUserId, genres, limit = 20, authToken) {
    try {
      // Fetch songs by genres and listening history in parallel
      const [genreData, playlistSongIds, historyData] = await Promise.all([
        makeRequest(
          `${SONG_CATALOG_URL}/songs/by-genres`,
          'post',
          { genres, limit: limit * 1.5 },
          authToken
        ),
        makeRequest(
          `${PLAYLIST_URL}/users/${clerkUserId}/playlists/song-ids`,
          'get',
          null,
          authToken
        ),
        makeRequest(
          `${USER_PROFILE_URL}/users/${clerkUserId}/history?limit=30`,
          'get',
          null,
          authToken
        ),
      ]);

      const listenedIds = new Set(playlistSongIds?.data || []);
      // Fix: access history instead of data
      const listeningHistory = historyData?.history || [];

      // Get song IDs from listening history and fetch full details to get artists
      let artistsFromHistory = new Set();
      if (listeningHistory.length > 0) {
        const historyIds = listeningHistory.slice(0, 20).map(item => item.songId);
        const songDetailsData = await makeRequest(
          `${SONG_CATALOG_URL}/songs/by-ids`,
          'post',
          { ids: historyIds },
          authToken
        );
        const songDetails = songDetailsData?.data || [];
        songDetails.forEach(song => {
          if (song.artist) artistsFromHistory.add(song.artist);
        });
      }

      // Score songs: prioritize if artist matches listening history
      const scoredSongs = (genreData?.data || []).map(song => {
        let score = 1;
        if (artistsFromHistory.has(song.artist)) {
          score = 10; // High priority if artist matches listening history
        }
        return { ...song, score };
      });

      // Sort by score then by playCount
      scoredSongs.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.playCount - a.playCount;
      });

      // Filter out already listened songs
      const filtered = scoredSongs.filter(
        (s) => !listenedIds.has(s._id?.toString())
      );

      return filtered.slice(0, limit);
    } catch (error) {
      logger.error('Error fetching genre recommendations:', error);
      return [];
    }
  }

  /**
   * Get songs similar to a specific song
   */
  async getSimilarSongs(songId, limit = 10, authToken) {
    try {
      const similarData = await makeRequest(
        `${SONG_CATALOG_URL}/songs/${songId}/similar?limit=${limit}`,
        'get',
        null,
        authToken
      );
      return similarData?.data || [];
    } catch (error) {
      logger.error('Error fetching similar songs:', error);
      return [];
    }
  }

  /**
   * Get user preferences that influence recommendations
   */
  async getUserPreferences(clerkUserId, authToken) {
    try {
      const prefData = await makeRequest(
        `${USER_PROFILE_URL}/users/${clerkUserId}/internal/preferences`,
        'get',
        null,
        authToken
      );
      return prefData?.data || {};
    } catch (error) {
      logger.error('Error fetching user preferences:', error);
      return {};
    }
  }
}

module.exports = new RecommendationService();
