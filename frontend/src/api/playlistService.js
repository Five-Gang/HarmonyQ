import { playlistApi } from '../lib/apiClient';

export const playlistService = {
  createPlaylist: (data) => playlistApi.post('/', data),
  getPlaylist: (id) => playlistApi.get(`/${id}`),
  updatePlaylist: (id, data) => playlistApi.put(`/${id}`, data),
  deletePlaylist: (id) => playlistApi.delete(`/${id}`),
  getUserPlaylists: (clerkUserId, params) => playlistApi.get(`/users/${clerkUserId}/playlists`, { params }),
  getPublicPlaylists: (params) => playlistApi.get('/public/browse', { params }),
  addSongs: (id, songIds) => playlistApi.post(`/${id}/songs`, { songIds }),
  removeSong: (id, songId) => playlistApi.delete(`/${id}/songs/${songId}`),
  reorderSongs: (id, songIds) => playlistApi.put(`/${id}/songs/reorder`, { songIds }),
};
