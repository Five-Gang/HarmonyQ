'use strict';

jest.mock('../../config/logger', () => ({
  error: jest.fn(), warn: jest.fn(), info: jest.fn(), http: jest.fn(), debug: jest.fn(),
}));
jest.mock('jwks-rsa', () => jest.fn(() => ({
  getSigningKey: jest.fn((kid, cb) => cb(null, { getPublicKey: () => 'pk' })),
})));
jest.mock('jsonwebtoken');
jest.mock('../../services/recommendationService');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const recommendationService = require('../../services/recommendationService');

const mockAuth = (userId = 'user_abc', roles = []) => {
  jwt.verify.mockImplementation((token, getKey, opts, cb) =>
    cb(null, { sub: userId, sid: 'sess', publicMetadata: { roles } })
  );
};

describe('Recommendation Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─── Health ───────────────────────────────────────────────────────────────────
  describe('GET /health', () => {
    test('returns 200 healthy', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.service).toBe('recommendation');
    });
  });

  // ─── GET /recommendations/trending/all ───────────────────────────────────────
  describe('GET /recommendations/trending/all', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).get('/recommendations/trending/all');
      expect(res.status).toBe(401);
    });

    test('returns 200 with valid token', async () => {
      mockAuth();
      recommendationService.getTrendingSongs.mockResolvedValue([{ title: 'Hot Song' }]);
      const res = await request(app)
        .get('/recommendations/trending/all')
        .set('Authorization', 'Bearer token');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── GET /recommendations/genre/:clerkUserId ──────────────────────────────────
  describe('GET /recommendations/genre/:clerkUserId', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).get('/recommendations/genre/user_abc');
      expect(res.status).toBe(401);
    });

    test('returns 400 when genres param missing', async () => {
      mockAuth();
      const res = await request(app)
        .get('/recommendations/genre/user_abc')
        .set('Authorization', 'Bearer token');
      expect(res.status).toBe(400);
    });

    test('returns 200 with genres provided', async () => {
      mockAuth();
      recommendationService.getRecommendationsByGenre.mockResolvedValue([]);
      const res = await request(app)
        .get('/recommendations/genre/user_abc?genres=Pop')
        .set('Authorization', 'Bearer token');
      expect(res.status).toBe(200);
    });
  });

  // ─── GET /recommendations/similar/:songId ────────────────────────────────────
  describe('GET /recommendations/similar/:songId', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).get('/recommendations/similar/song123');
      expect(res.status).toBe(401);
    });

    test('returns 200 with valid token', async () => {
      mockAuth();
      recommendationService.getSimilarSongs.mockResolvedValue([]);
      const res = await request(app)
        .get('/recommendations/similar/song123')
        .set('Authorization', 'Bearer token');
      expect(res.status).toBe(200);
    });
  });

  // ─── GET /recommendations/:clerkUserId/preferences ───────────────────────────
  describe('GET /recommendations/:clerkUserId/preferences', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).get('/recommendations/user_abc/preferences');
      expect(res.status).toBe(401);
    });

    test('returns 200 for own preferences', async () => {
      mockAuth('user_abc');
      recommendationService.getUserPreferences.mockResolvedValue({});
      const res = await request(app)
        .get('/recommendations/user_abc/preferences')
        .set('Authorization', 'Bearer token');
      expect(res.status).toBe(200);
    });

    test('returns 403 for other user', async () => {
      mockAuth('other_user');
      const res = await request(app)
        .get('/recommendations/user_abc/preferences')
        .set('Authorization', 'Bearer token');
      expect(res.status).toBe(403);
    });
  });

  // ─── GET /recommendations/:clerkUserId ───────────────────────────────────────
  describe('GET /recommendations/:clerkUserId', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).get('/recommendations/user_abc');
      expect(res.status).toBe(401);
    });

    test('returns 200 for own recommendations', async () => {
      mockAuth('user_abc');
      recommendationService.getRecommendations.mockResolvedValue({ recommendations: [], strategy: 'trending_fallback' });
      const res = await request(app)
        .get('/recommendations/user_abc')
        .set('Authorization', 'Bearer token');
      expect(res.status).toBe(200);
    });

    test('returns 403 for another user', async () => {
      mockAuth('other_user');
      const res = await request(app)
        .get('/recommendations/user_abc')
        .set('Authorization', 'Bearer token');
      expect(res.status).toBe(403);
    });
  });

  // ─── 404 handler ─────────────────────────────────────────────────────────────
  describe('404 handler', () => {
    test('returns 404 for unknown route', async () => {
      const res = await request(app).get('/unknown-xyz');
      expect(res.status).toBe(404);
    });
  });
});
