import { userApi } from '../lib/apiClient';

export const userService = {
  syncUser: (data) => userApi.post('/sync', data),
  getProfile: (clerkUserId) => userApi.get(`/${clerkUserId}`),
  updateProfile: (clerkUserId, data) => userApi.put(`/${clerkUserId}`, data),
  updatePreferences: (clerkUserId, preferences) => userApi.put(`/${clerkUserId}/preferences`, { preferences }),
  getHistory: (clerkUserId, params) => userApi.get(`/${clerkUserId}/history`, { params }),
  addToHistory: (clerkUserId, data) => userApi.post(`/${clerkUserId}/history`, data),
  getFavorites: (clerkUserId) => userApi.get(`/${clerkUserId}/favorites`),
  addToFavorites: (clerkUserId, songId) => userApi.post(`/${clerkUserId}/favorites/${songId}`),
  removeFromFavorites: (clerkUserId, songId) => userApi.delete(`/${clerkUserId}/favorites/${songId}`),
};
