'use strict';

jest.mock('../../config/logger', () => ({
  error: jest.fn(), warn: jest.fn(), info: jest.fn(), http: jest.fn(), debug: jest.fn(),
}));
jest.mock('../../config/database', () => jest.fn().mockResolvedValue(true));
jest.mock('jwks-rsa', () => jest.fn(() => ({
  getSigningKey: jest.fn((kid, cb) => cb(null, { getPublicKey: () => 'pk' })),
})));
jest.mock('jsonwebtoken');
jest.mock('../../services/userProfileService');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const userProfileService = require('../../services/userProfileService');

const MOCK_PROFILE = {
  clerkUserId: 'user_abc123',
  email: 'test@example.com',
  displayName: 'Test User',
  preferences: { favoriteGenres: ['Pop'] },
  favoriteSongIds: [],
};

const mockAuth = (userId = 'user_abc123', roles = []) => {
  jwt.verify.mockImplementation((token, getKey, opts, cb) =>
    cb(null, { sub: userId, sid: 'sess_abc', publicMetadata: { roles } })
  );
};

describe('User Profile Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─── Health ───────────────────────────────────────────────────────────────────
  describe('GET /health', () => {
    test('returns 200 healthy', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.service).toBe('user-profile');
    });
  });

  // ─── POST /users/sync ─────────────────────────────────────────────────────────
  describe('POST /users/sync', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).post('/users/sync').send({});
      expect(res.status).toBe(401);
    });

    test('returns 200 with valid token', async () => {
      mockAuth();
      userProfileService.syncUser.mockResolvedValue(MOCK_PROFILE);
      const res = await request(app)
        .post('/users/sync')
        .set('Authorization', 'Bearer valid-token')
        .send({ clerkUserId: 'user_abc123', email: 'test@example.com' });
      expect(res.status).toBe(200);
    });
  });

  // ─── GET /users/:clerkUserId ──────────────────────────────────────────────────
  describe('GET /users/:clerkUserId', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).get('/users/user_abc123');
      expect(res.status).toBe(401);
    });

    test('returns 200 for own profile', async () => {
      mockAuth('user_abc123');
      userProfileService.getUserProfile.mockResolvedValue(MOCK_PROFILE);
      const res = await request(app)
        .get('/users/user_abc123')
        .set('Authorization', 'Bearer valid-token');
      expect(res.status).toBe(200);
    });

    test('returns 403 for other user profile', async () => {
      mockAuth('different_user');
      const res = await request(app)
        .get('/users/user_abc123')
        .set('Authorization', 'Bearer valid-token');
      expect(res.status).toBe(403);
    });
  });

  // ─── PUT /users/:clerkUserId ──────────────────────────────────────────────────
  describe('PUT /users/:clerkUserId', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).put('/users/user_abc123').send({});
      expect(res.status).toBe(401);
    });

    test('returns 200 for own update', async () => {
      mockAuth('user_abc123');
      userProfileService.updateProfile.mockResolvedValue(MOCK_PROFILE);
      const res = await request(app)
        .put('/users/user_abc123')
        .set('Authorization', 'Bearer valid-token')
        .send({ displayName: 'New Name' });
      expect(res.status).toBe(200);
    });
  });

  // ─── PUT /users/:clerkUserId/preferences ─────────────────────────────────────
  describe('PUT /users/:clerkUserId/preferences', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).put('/users/user_abc123/preferences').send({});
      expect(res.status).toBe(401);
    });

    test('returns 200 for own preferences update', async () => {
      mockAuth('user_abc123');
      userProfileService.updatePreferences.mockResolvedValue(MOCK_PROFILE);
      const res = await request(app)
        .put('/users/user_abc123/preferences')
        .set('Authorization', 'Bearer valid-token')
        .send({ preferences: { favoriteGenres: ['Rock'] } });
      expect(res.status).toBe(200);
    });
  });

  // ─── GET /users/:clerkUserId/history ─────────────────────────────────────────
  describe('GET /users/:clerkUserId/history', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).get('/users/user_abc123/history');
      expect(res.status).toBe(401);
    });

    test('returns 200 for own history', async () => {
      mockAuth('user_abc123');
      userProfileService.getListeningHistory.mockResolvedValue({ history: [], totalListeningTime: 0, pagination: {} });
      const res = await request(app)
        .get('/users/user_abc123/history')
        .set('Authorization', 'Bearer valid-token');
      expect(res.status).toBe(200);
    });
  });

  // ─── POST /users/:clerkUserId/history ────────────────────────────────────────
  describe('POST /users/:clerkUserId/history', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).post('/users/user_abc123/history').send({});
      expect(res.status).toBe(401);
    });

    test('returns 200 for adding own history', async () => {
      mockAuth('user_abc123');
      userProfileService.addToHistory.mockResolvedValue({ message: 'History updated' });
      const res = await request(app)
        .post('/users/user_abc123/history')
        .set('Authorization', 'Bearer valid-token')
        .send({ songId: 'song1', duration: 180 });
      expect(res.status).toBe(200);
    });
  });

  // ─── GET /users/:clerkUserId/favorites ───────────────────────────────────────
  describe('GET /users/:clerkUserId/favorites', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).get('/users/user_abc123/favorites');
      expect(res.status).toBe(401);
    });

    test('returns 200 for own favorites', async () => {
      mockAuth('user_abc123');
      userProfileService.getFavorites.mockResolvedValue({ favoriteSongIds: [] });
      const res = await request(app)
        .get('/users/user_abc123/favorites')
        .set('Authorization', 'Bearer valid-token');
      expect(res.status).toBe(200);
    });
  });

  // ─── POST /users/:clerkUserId/favorites/:songId ───────────────────────────────
  describe('POST /users/:clerkUserId/favorites/:songId', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).post('/users/user_abc123/favorites/song1');
      expect(res.status).toBe(401);
    });

    test('returns 200 when adding to favorites', async () => {
      mockAuth('user_abc123');
      userProfileService.addToFavorites.mockResolvedValue({ message: 'Added to favorites', favoriteSongIds: ['song1'] });
      const res = await request(app)
        .post('/users/user_abc123/favorites/song1')
        .set('Authorization', 'Bearer valid-token');
      expect(res.status).toBe(200);
    });
  });

  // ─── DELETE /users/:clerkUserId/favorites/:songId ────────────────────────────
  describe('DELETE /users/:clerkUserId/favorites/:songId', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).delete('/users/user_abc123/favorites/song1');
      expect(res.status).toBe(401);
    });

    test('returns 200 when removing favorite', async () => {
      mockAuth('user_abc123');
      userProfileService.removeFromFavorites.mockResolvedValue({ message: 'Removed from favorites', favoriteSongIds: [] });
      const res = await request(app)
        .delete('/users/user_abc123/favorites/song1')
        .set('Authorization', 'Bearer valid-token');
      expect(res.status).toBe(200);
    });
  });

  // ─── GET /users/:clerkUserId/internal/preferences ────────────────────────────
  describe('GET /users/:clerkUserId/internal/preferences', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).get('/users/user_abc123/internal/preferences');
      expect(res.status).toBe(401);
    });

    test('returns 200 with token', async () => {
      mockAuth('user_abc123');
      userProfileService.getUserPreferences.mockResolvedValue({ preferences: {}, recentSongIds: [] });
      const res = await request(app)
        .get('/users/user_abc123/internal/preferences')
        .set('Authorization', 'Bearer valid-token');
      expect(res.status).toBe(200);
    });
  });

  // ─── 404 handler ─────────────────────────────────────────────────────────────
  describe('404 handler', () => {
    test('returns 404 for unknown route', async () => {
      const res = await request(app).get('/unknown-route-xyz');
      expect(res.status).toBe(404);
    });
  });
});
