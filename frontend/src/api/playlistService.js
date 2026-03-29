import { playlistApi } from '../lib/apiClient';

export const playlistService = {
  createPlaylist: (data) => playlistApi.post('/', data),
  getPlaylist: (id) => playlistApi.get(`/${id}`),
  updatePlaylist: (id, data) => playlistApi.put(`/${id}`, data),
  deletePlaylist: (id) => playlistApi.delete(`/${id}`),
  getUserPlaylists: (clerkUserId, params) => playlistApi.get(`/users/${clerkUserId}/playlists`, { params }),
  getPublicPlaylists: (params) => playlistApi.get('/public/browse', { params }),
  getFollowingPlaylists: (params) => playlistApi.get('/following', { params }),
  getAllPlaylistsAdmin: (params) => playlistApi.get('/admin/all', { params }),
  setPlaylistStatus: (id, data) => playlistApi.put(`/${id}/admin/status`, data),
  deletePlaylistAdmin: (id) => playlistApi.delete(`/${id}/admin/delete`),
  addSongs: (id, songIds) => playlistApi.post(`/${id}/songs`, { songIds }),
  removeSong: (id, songId) => playlistApi.delete(`/${id}/songs/${songId}`),
  reorderSongs: (id, songIds) => playlistApi.put(`/${id}/songs/reorder`, { songIds }),
  followPlaylist: (id) => playlistApi.post(`/${id}/follow`),
  unfollowPlaylist: (id) => playlistApi.post(`/${id}/unfollow`),
};
