'use strict';

// Mock heavy modules before requiring app
jest.mock('../../config/logger', () => ({
  error: jest.fn(), warn: jest.fn(), info: jest.fn(), http: jest.fn(), debug: jest.fn(),
}));
jest.mock('../../config/database', () => jest.fn().mockResolvedValue(true));
jest.mock('../../config/cloudinary', () => ({ uploadToCloudinary: jest.fn() }));
jest.mock('../../config/azure', () => ({ uploadToAzure: jest.fn() }));
jest.mock('jwks-rsa', () => jest.fn(() => ({
  getSigningKey: jest.fn((kid, cb) => cb(null, { getPublicKey: () => 'pk' })),
})));
jest.mock('jsonwebtoken');
jest.mock('../../services/songService');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const songService = require('../../services/songService');

const MOCK_SONG = {
  _id: '507f1f77bcf86cd799439011',
  title: 'Test Song', artist: 'Test Artist', genre: 'Pop',
  duration: 180, releaseYear: 2023, isActive: true, playCount: 0,
};

// Helper: make JWT mock return a valid decoded payload
const mockAuth = (roles = []) => {
  jwt.verify.mockImplementation((token, getKey, opts, cb) =>
    cb(null, { sub: 'user_123', sid: 'sess_abc', publicMetadata: { roles } })
  );
};

describe('Song Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─── Health ──────────────────────────────────────────────────────────────────
  describe('GET /health', () => {
    test('returns 200 healthy', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
    });
  });

  // ─── GET /songs ───────────────────────────────────────────────────────────────
  describe('GET /songs', () => {
    test('returns 200 with songs list', async () => {
      songService.getSongs.mockResolvedValue({
        songs: [MOCK_SONG],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });
      const res = await request(app).get('/songs');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('returns 400 for invalid genre query param', async () => {
      const res = await request(app).get('/songs?genre=INVALID_GENRE');
      expect(res.status).toBe(400);
    });
  });

  // ─── GET /songs/trending ──────────────────────────────────────────────────────
  describe('GET /songs/trending', () => {
    test('returns 200 with trending songs', async () => {
      songService.getTrendingSongs.mockResolvedValue([MOCK_SONG]);
      const res = await request(app).get('/songs/trending');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── GET /songs/:id ───────────────────────────────────────────────────────────
  describe('GET /songs/:id', () => {
    test('returns 200 for valid mongo ID', async () => {
      songService.getSongById.mockResolvedValue(MOCK_SONG);
      const res = await request(app).get(`/songs/${MOCK_SONG._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ title: 'Test Song' });
    });

    test('returns 400 for invalid ID format', async () => {
      const res = await request(app).get('/songs/not-a-valid-id');
      expect(res.status).toBe(400);
    });
  });

  // ─── POST /songs/batch (authenticated) ────────────────────────────────────────
  describe('POST /songs/batch', () => {
    test('returns 401 without auth token', async () => {
      const res = await request(app).post('/songs/batch').send({ ids: [] });
      expect(res.status).toBe(401);
    });

    test('returns 200 with valid token', async () => {
      mockAuth();
      songService.getSongsByIds.mockResolvedValue([MOCK_SONG]);
      const res = await request(app)
        .post('/songs/batch')
        .set('Authorization', 'Bearer valid-token')
        .send({ ids: [MOCK_SONG._id] });
      expect(res.status).toBe(200);
    });
  });

  // ─── POST /songs/by-genres (authenticated) ────────────────────────────────────
  describe('POST /songs/by-genres', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).post('/songs/by-genres').send({ genres: ['Pop'] });
      expect(res.status).toBe(401);
    });

    test('returns 200 with auth token', async () => {
      mockAuth();
      songService.getSongsByGenres.mockResolvedValue([MOCK_SONG]);
      const res = await request(app)
        .post('/songs/by-genres')
        .set('Authorization', 'Bearer valid-token')
        .send({ genres: ['Pop'], limit: 10 });
      expect(res.status).toBe(200);
    });
  });

  // ─── POST /songs/:id/play ─────────────────────────────────────────────────────
  describe('POST /songs/:id/play', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).post(`/songs/${MOCK_SONG._id}/play`);
      expect(res.status).toBe(401);
    });

    test('returns 200 with valid token', async () => {
      mockAuth();
      songService.incrementPlayCount.mockResolvedValue(undefined);
      const res = await request(app)
        .post(`/songs/${MOCK_SONG._id}/play`)
        .set('Authorization', 'Bearer valid-token');
      expect(res.status).toBe(200);
    });
  });

  // ─── POST /songs (admin only) ─────────────────────────────────────────────────
  describe('POST /songs (admin)', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).post('/songs').send({});
      expect(res.status).toBe(401);
    });

    test('returns 403 for non-admin user', async () => {
      mockAuth([]);
      const res = await request(app)
        .post('/songs')
        .set('Authorization', 'Bearer valid-token')
        .send({});
      expect(res.status).toBe(403);
    });
  });

  // ─── PUT /songs/:id (admin only) ──────────────────────────────────────────────
  describe('PUT /songs/:id (admin)', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).put(`/songs/${MOCK_SONG._id}`).send({});
      expect(res.status).toBe(401);
    });

    test('returns 403 for non-admin', async () => {
      mockAuth([]);
      const res = await request(app)
        .put(`/songs/${MOCK_SONG._id}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ title: 'Updated' });
      expect(res.status).toBe(403);
    });

    test('returns 200 for admin', async () => {
      mockAuth(['admin']);
      songService.updateSong.mockResolvedValue({ ...MOCK_SONG, title: 'Updated' });
      const res = await request(app)
        .put(`/songs/${MOCK_SONG._id}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ title: 'Updated' });
      expect(res.status).toBe(200);
    });
  });

  // ─── DELETE /songs/:id (admin only) ───────────────────────────────────────────
  describe('DELETE /songs/:id (admin)', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).delete(`/songs/${MOCK_SONG._id}`);
      expect(res.status).toBe(401);
    });

    test('returns 403 for non-admin', async () => {
      mockAuth([]);
      const res = await request(app)
        .delete(`/songs/${MOCK_SONG._id}`)
        .set('Authorization', 'Bearer valid-token');
      expect(res.status).toBe(403);
    });

    test('returns 200 for admin', async () => {
      mockAuth(['admin']);
      songService.deleteSong.mockResolvedValue({ message: 'Song deleted successfully' });
      const res = await request(app)
        .delete(`/songs/${MOCK_SONG._id}`)
        .set('Authorization', 'Bearer valid-token');
      expect(res.status).toBe(200);
    });
  });

  // ─── 404 handler ─────────────────────────────────────────────────────────────
  describe('404 handler', () => {
    test('returns 404 for unknown route', async () => {
      const res = await request(app).get('/unknown-route-xyz');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
