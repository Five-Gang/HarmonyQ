import { songApi } from '../lib/apiClient';

export const songService = {
  getSongs: (params) => songApi.get('/', { params }),
  getSongById: (id) => songApi.get(`/${id}`),
  getTrending: (limit = 10) => songApi.get('/trending', { params: { limit } }),
  createSong: (data) => songApi.post('/', data),
  updateSong: (id, data) => songApi.put(`/${id}`, data),
  deleteSong: (id) => songApi.delete(`/${id}`),
  incrementPlay: (id) => songApi.post(`/${id}/play`),
};
