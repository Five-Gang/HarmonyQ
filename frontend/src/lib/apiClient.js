import axios from 'axios';

const BASE_URLS = {
  songs: import.meta.env.VITE_SONG_CATALOG_URL || '/api/songs',
  users: import.meta.env.VITE_USER_PROFILE_URL || '/api/users',
  playlists: import.meta.env.VITE_PLAYLIST_URL || '/api/playlists',
  recommendations: import.meta.env.VITE_RECOMMENDATION_URL || '/api/recommendations',
};

const createApiClient = (baseURL) => {
  const client = axios.create({
    baseURL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
  });

  // Request interceptor: attach Clerk token
  client.interceptors.request.use(async (config) => {
    // Token is attached by the caller via setAuthToken
    return config;
  });

  // Response interceptor: normalize errors
  client.interceptors.response.use(
    (response) => response.data,
    (error) => {
      const message = error.response?.data?.message || error.message || 'An error occurred';
      return Promise.reject(new Error(message));
    }
  );

  return client;
};

export const songApi = createApiClient(BASE_URLS.songs);
export const userApi = createApiClient(BASE_URLS.users);
export const playlistApi = createApiClient(BASE_URLS.playlists);
export const recommendationApi = createApiClient(BASE_URLS.recommendations);

/**
 * Set auth token on all API clients
 */
export const setAuthToken = (token) => {
  [songApi, userApi, playlistApi, recommendationApi].forEach((client) => {
    client.defaults.headers.common['Authorization'] = token ? `Bearer ${token}` : '';
  });
};

export const clearAuthToken = () => setAuthToken(null);
