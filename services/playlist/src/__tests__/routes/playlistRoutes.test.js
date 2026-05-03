'use strict';

jest.mock('../../config/logger', () => ({
  error: jest.fn(), warn: jest.fn(), info: jest.fn(), http: jest.fn(), debug: jest.fn(),
}));
jest.mock('../../config/database', () => jest.fn().mockResolvedValue(true));
jest.mock('jwks-rsa', () => jest.fn(() => ({
  getSigningKey: jest.fn((kid, cb) => cb(null, { getPublicKey: () => 'pk' })),
})));
jest.mock('jsonwebtoken');
jest.mock('../../services/playlistService');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const playlistService = require('../../services/playlistService');

const MOCK_PLAYLIST = {
  _id: '507f1f77bcf86cd799439011',
  name: 'My Playlist',
  clerkUserId: 'user_abc123',
  isPublic: true,
  songIds: [],
};

const mockAuth = (userId = 'user_abc123', roles = []) => {
  jwt.verify.mockImplementation((token, getKey, opts, cb) =>
    cb(null, { sub: userId, sid: 'sess', publicMetadata: { roles } })
  );
};

describe('Playlist Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─── Health ───────────────────────────────────────────────────────────────────
  describe('GET /health', () => {
    test('returns 200 healthy', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.service).toBe('playlist');
    });
  });

  // ─── POST /playlists ──────────────────────────────────────────────────────────
  describe('POST /playlists', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).post('/playlists').send({ name: 'Test' });
      expect(res.status).toBe(401);
    });

    test('returns 201 with valid token', async () => {
      mockAuth();
      playlistService.createPlaylist.mockResolvedValue(MOCK_PLAYLIST);
      const res = await request(app)
        .post('/playlists')
        .set('Authorization', 'Bearer token')
        .send({ name: 'My Playlist' });
      expect(res.status).toBe(201);
    });
  });

  // ─── GET /playlists/admin/all ─────────────────────────────────────────────────
  describe('GET /playlists/admin/all', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).get('/playlists/admin/all');
      expect(res.status).toBe(401);
    });

    test('returns 200 with token', async () => {
      mockAuth('user_abc123', ['admin']);
      playlistService.getAllPlaylistsAdmin.mockResolvedValue({ playlists: [], pagination: {} });
      const res = await request(app)
        .get('/playlists/admin/all')
        .set('Authorization', 'Bearer token');
      expect(res.status).toBe(200);
    });
  });

  // ─── GET /playlists/following ─────────────────────────────────────────────────
  describe('GET /playlists/following', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).get('/playlists/following');
      expect(res.status).toBe(401);
    });

    test('returns 200 with token', async () => {
      mockAuth();
      playlistService.getFollowingPlaylists.mockResolvedValue({ playlists: [], pagination: {} });
      const res = await request(app)
        .get('/playlists/following')
        .set('Authorization', 'Bearer token');
      expect(res.status).toBe(200);
    });
  });

  // ─── GET /playlists/public/browse ────────────────────────────────────────────
  describe('GET /playlists/public/browse', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).get('/playlists/public/browse');
      expect(res.status).toBe(401);
    });

    test('returns 200 with token', async () => {
      mockAuth();
      playlistService.getPublicPlaylists.mockResolvedValue({ playlists: [], pagination: {} });
      const res = await request(app)
        .get('/playlists/public/browse')
        .set('Authorization', 'Bearer token');
      expect(res.status).toBe(200);
    });
  });

  // ─── GET /playlists/:id ───────────────────────────────────────────────────────
  describe('GET /playlists/:id', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).get(`/playlists/${MOCK_PLAYLIST._id}`);
      expect(res.status).toBe(401);
    });

    test('returns 200 with valid token', async () => {
      mockAuth();
      playlistService.getPlaylistById.mockResolvedValue(MOCK_PLAYLIST);
      const res = await request(app)
        .get(`/playlists/${MOCK_PLAYLIST._id}`)
        .set('Authorization', 'Bearer token');
      expect(res.status).toBe(200);
    });
  });

  // ─── PUT /playlists/:id ───────────────────────────────────────────────────────
  describe('PUT /playlists/:id', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).put(`/playlists/${MOCK_PLAYLIST._id}`).send({});
      expect(res.status).toBe(401);
    });

    test('returns 200 with token', async () => {
      mockAuth();
      playlistService.updatePlaylist.mockResolvedValue(MOCK_PLAYLIST);
      const res = await request(app)
        .put(`/playlists/${MOCK_PLAYLIST._id}`)
        .set('Authorization', 'Bearer token')
        .send({ name: 'Updated' });
      expect(res.status).toBe(200);
    });
  });

  // ─── DELETE /playlists/:id ────────────────────────────────────────────────────
  describe('DELETE /playlists/:id', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).delete(`/playlists/${MOCK_PLAYLIST._id}`);
      expect(res.status).toBe(401);
    });

    test('returns 200 with token', async () => {
      mockAuth();
      playlistService.deletePlaylist.mockResolvedValue({ message: 'Playlist deleted successfully' });
      const res = await request(app)
        .delete(`/playlists/${MOCK_PLAYLIST._id}`)
        .set('Authorization', 'Bearer token');
      expect(res.status).toBe(200);
    });
  });

  // ─── POST /playlists/:id/songs ────────────────────────────────────────────────
  describe('POST /playlists/:id/songs', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).post(`/playlists/${MOCK_PLAYLIST._id}/songs`).send({ songIds: [] });
      expect(res.status).toBe(401);
    });

    test('returns 200 with token', async () => {
      mockAuth();
      playlistService.addSongs.mockResolvedValue(MOCK_PLAYLIST);
      const res = await request(app)
        .post(`/playlists/${MOCK_PLAYLIST._id}/songs`)
        .set('Authorization', 'Bearer token')
        .send({ songIds: ['song1'] });
      expect(res.status).toBe(200);
    });
  });

  // ─── DELETE /playlists/:id/songs/:songId ─────────────────────────────────────
  describe('DELETE /playlists/:id/songs/:songId', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).delete(`/playlists/${MOCK_PLAYLIST._id}/songs/song1`);
      expect(res.status).toBe(401);
    });

    test('returns 200 with token', async () => {
      mockAuth();
      playlistService.removeSong.mockResolvedValue(MOCK_PLAYLIST);
      const res = await request(app)
        .delete(`/playlists/${MOCK_PLAYLIST._id}/songs/song1`)
        .set('Authorization', 'Bearer token');
      expect(res.status).toBe(200);
    });
  });

  // ─── PUT /playlists/:id/songs/reorder ────────────────────────────────────────
  describe('PUT /playlists/:id/songs/reorder', () => {
    test('returns 200 with token', async () => {
      mockAuth();
      playlistService.reorderSongs.mockResolvedValue(MOCK_PLAYLIST);
      const res = await request(app)
        .put(`/playlists/${MOCK_PLAYLIST._id}/songs/reorder`)
        .set('Authorization', 'Bearer token')
        .send({ songIds: ['s1', 's2'] });
      expect(res.status).toBe(200);
    });
  });

  // ─── POST /playlists/:id/follow ───────────────────────────────────────────────
  describe('POST /playlists/:id/follow', () => {
    test('returns 200 with token', async () => {
      mockAuth();
      playlistService.followPlaylist.mockResolvedValue({ success: true, followerCount: 1 });
      const res = await request(app)
        .post(`/playlists/${MOCK_PLAYLIST._id}/follow`)
        .set('Authorization', 'Bearer token');
      expect(res.status).toBe(200);
    });
  });

  // ─── POST /playlists/:id/unfollow ─────────────────────────────────────────────
  describe('POST /playlists/:id/unfollow', () => {
    test('returns 200 with token', async () => {
      mockAuth();
      playlistService.unfollowPlaylist.mockResolvedValue({ success: true, followerCount: 0 });
      const res = await request(app)
        .post(`/playlists/${MOCK_PLAYLIST._id}/unfollow`)
        .set('Authorization', 'Bearer token');
      expect(res.status).toBe(200);
    });
  });

  // ─── User playlist routes ─────────────────────────────────────────────────────
  describe('GET /users/:clerkUserId/playlists', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).get('/users/user_abc123/playlists');
      expect(res.status).toBe(401);
    });

    test('returns 200 with token', async () => {
      mockAuth();
      playlistService.getUserPlaylists.mockResolvedValue({ playlists: [], pagination: {} });
      const res = await request(app)
        .get('/users/user_abc123/playlists')
        .set('Authorization', 'Bearer token');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /users/:clerkUserId/playlists/song-ids', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).get('/users/user_abc123/playlists/song-ids');
      expect(res.status).toBe(401);
    });

    test('returns 200 with token', async () => {
      mockAuth();
      playlistService.getUserPlaylistSongIds.mockResolvedValue(['s1', 's2']);
      const res = await request(app)
        .get('/users/user_abc123/playlists/song-ids')
        .set('Authorization', 'Bearer token');
      expect(res.status).toBe(200);
    });
  });

  // ─── 404 ─────────────────────────────────────────────────────────────────────
  describe('404 handler', () => {
    test('returns 404 for unknown route', async () => {
      const res = await request(app).get('/unknown-route');
      expect(res.status).toBe(404);
    });
  });
});
