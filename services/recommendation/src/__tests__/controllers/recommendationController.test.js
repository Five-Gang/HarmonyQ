'use strict';

jest.mock('../../config/logger', () => ({
  error: jest.fn(), warn: jest.fn(), info: jest.fn(), http: jest.fn(), debug: jest.fn(),
}));
jest.mock('../../services/recommendationService');

const recommendationService = require('../../services/recommendationService');
const recommendationController = require('../../controllers/recommendationController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const makeAuth = (userId = 'user_abc', roles = []) => ({ userId, roles });

describe('RecommendationController', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─── getRecommendations ───────────────────────────────────────────────────────
  describe('getRecommendations', () => {
    test('returns 200 with recommendations for own user', async () => {
      recommendationService.getRecommendations.mockResolvedValue({ recommendations: [], strategy: 'personalized' });
      const req = { params: { clerkUserId: 'user_abc' }, auth: makeAuth('user_abc'), headers: { authorization: 'Bearer tok' } };
      const res = mockRes();
      await recommendationController.getRecommendations(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('returns 200 for admin accessing other user', async () => {
      recommendationService.getRecommendations.mockResolvedValue({ recommendations: [] });
      const req = { params: { clerkUserId: 'user_abc' }, auth: makeAuth('admin_user', ['admin']), headers: { authorization: 'Bearer tok' } };
      const res = mockRes();
      await recommendationController.getRecommendations(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('returns 403 when unauthorized user accesses recommendations', async () => {
      const req = { params: { clerkUserId: 'user_abc' }, auth: makeAuth('other_user'), headers: {} };
      const res = mockRes();
      await recommendationController.getRecommendations(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('calls next on error', async () => {
      recommendationService.getRecommendations.mockRejectedValue(new Error('service down'));
      const next = jest.fn();
      const req = { params: { clerkUserId: 'user_abc' }, auth: makeAuth('user_abc'), headers: {} };
      await recommendationController.getRecommendations(req, mockRes(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  // ─── getTrendingSongs ────────────────────────────────────────────────────────
  describe('getTrendingSongs', () => {
    test('returns 200 with trending songs', async () => {
      recommendationService.getTrendingSongs.mockResolvedValue([{ title: 'Hot Song' }]);
      const req = { query: { limit: '10' }, headers: { authorization: 'Bearer tok' } };
      const res = mockRes();
      await recommendationController.getTrendingSongs(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('uses default limit of 20', async () => {
      recommendationService.getTrendingSongs.mockResolvedValue([]);
      const req = { query: {}, headers: {} };
      const res = mockRes();
      await recommendationController.getTrendingSongs(req, res, jest.fn());
      expect(recommendationService.getTrendingSongs).toHaveBeenCalledWith(20, undefined);
    });
  });

  // ─── getRecommendationsByGenre ───────────────────────────────────────────────
  describe('getRecommendationsByGenre', () => {
    test('returns 400 when genres missing', async () => {
      const req = { params: { clerkUserId: 'user_abc' }, query: {}, headers: {} };
      const res = mockRes();
      await recommendationController.getRecommendationsByGenre(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 200 with genre recommendations', async () => {
      recommendationService.getRecommendationsByGenre.mockResolvedValue([{ title: 'Pop Song' }]);
      const req = {
        params: { clerkUserId: 'user_abc' },
        query: { genres: 'Pop', limit: '10' },
        headers: { authorization: 'Bearer tok' },
      };
      const res = mockRes();
      await recommendationController.getRecommendationsByGenre(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('handles genres as array', async () => {
      recommendationService.getRecommendationsByGenre.mockResolvedValue([]);
      const req = {
        params: { clerkUserId: 'user_abc' },
        query: { genres: ['Pop', 'Rock'], limit: '5' },
        headers: {},
      };
      const res = mockRes();
      await recommendationController.getRecommendationsByGenre(req, res, jest.fn());
      expect(recommendationService.getRecommendationsByGenre).toHaveBeenCalledWith(
        'user_abc', ['Pop', 'Rock'], '5', undefined
      );
    });
  });

  // ─── getSimilarSongs ──────────────────────────────────────────────────────────
  describe('getSimilarSongs', () => {
    test('returns 200 with similar songs', async () => {
      recommendationService.getSimilarSongs.mockResolvedValue([{ title: 'Similar Song' }]);
      const req = { params: { songId: 'song1' }, query: { limit: '5' }, headers: { authorization: 'Bearer tok' } };
      const res = mockRes();
      await recommendationController.getSimilarSongs(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('calls next on error', async () => {
      recommendationService.getSimilarSongs.mockRejectedValue(new Error('fail'));
      const next = jest.fn();
      await recommendationController.getSimilarSongs({ params: { songId: 's' }, query: {}, headers: {} }, mockRes(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  // ─── getUserPreferences ───────────────────────────────────────────────────────
  describe('getUserPreferences', () => {
    test('returns 200 for own user', async () => {
      recommendationService.getUserPreferences.mockResolvedValue({ favoriteGenres: ['Pop'] });
      const req = { params: { clerkUserId: 'user_abc' }, auth: makeAuth('user_abc'), headers: { authorization: 'Bearer tok' } };
      const res = mockRes();
      await recommendationController.getUserPreferences(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('returns 403 for unauthorized', async () => {
      const req = { params: { clerkUserId: 'user_abc' }, auth: makeAuth('other_user'), headers: {} };
      const res = mockRes();
      await recommendationController.getUserPreferences(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('returns 200 for admin', async () => {
      recommendationService.getUserPreferences.mockResolvedValue({});
      const req = { params: { clerkUserId: 'user_abc' }, auth: makeAuth('admin', ['admin']), headers: { authorization: 'Bearer tok' } };
      const res = mockRes();
      await recommendationController.getUserPreferences(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
