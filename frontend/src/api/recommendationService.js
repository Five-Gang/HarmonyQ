import { recommendationApi } from '../lib/apiClient';

export const recommendationService = {
  // Get personalized recommendations for user
  getRecommendations: (clerkUserId) => recommendationApi.get(`/${clerkUserId}`),

  // Get trending songs for discovery
  getTrendingSongs: (limit = 20) => recommendationApi.get(`/trending/all?limit=${limit}`),

  // Get recommendations filtered by genres
  getRecommendationsByGenre: (clerkUserId, genres, limit = 20) => {
    const genreParam = Array.isArray(genres) ? genres.join(',') : genres;
    return recommendationApi.get(`/genre/${clerkUserId}?genres=${genreParam}&limit=${limit}`);
  },

  // Get songs similar to a specific song
  getSimilarSongs: (songId, limit = 10) => recommendationApi.get(`/similar/${songId}?limit=${limit}`),

  // Get user preferences that affect recommendations
  getUserPreferences: (clerkUserId) => recommendationApi.get(`/${clerkUserId}/preferences`),
};
