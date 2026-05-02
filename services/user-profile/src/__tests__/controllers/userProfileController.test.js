'use strict';

jest.mock('../../config/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
  debug: jest.fn(),
}));

jest.mock('../../services/userProfileService');
const userProfileService = require('../../services/userProfileService');
const userProfileController = require('../../controllers/userProfileController');

const MOCK_PROFILE = {
  clerkUserId: 'user_abc123',
  email: 'test@example.com',
  displayName: 'Test User',
  preferences: { favoriteGenres: ['Pop'] },
  favoriteSongIds: ['song1'],
};

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const makeAuth = (userId = 'user_abc123', roles = []) => ({ userId, roles });

describe('UserProfileController', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('syncUser', () => {
    test('syncs user and returns 200', async () => {
      userProfileService.syncUser.mockResolvedValue(MOCK_PROFILE);
      const req = { body: { clerkUserId: 'user_abc123', email: 'test@example.com', displayName: 'Test', avatar: null } };
      const res = mockRes();
      await userProfileController.syncUser(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('calls next on error', async () => {
      userProfileService.syncUser.mockRejectedValue(new Error('DB error'));
      const next = jest.fn();
      await userProfileController.syncUser({ body: {} }, mockRes(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getUserProfile', () => {
    test('returns 200 for own profile', async () => {
      userProfileService.getUserProfile.mockResolvedValue(MOCK_PROFILE);
      const req = { params: { clerkUserId: 'user_abc123' }, auth: makeAuth('user_abc123') };
      const res = mockRes();
      await userProfileController.getUserProfile(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('returns 200 for admin accessing other profile', async () => {
      userProfileService.getUserProfile.mockResolvedValue(MOCK_PROFILE);
      const req = { params: { clerkUserId: 'user_abc123' }, auth: makeAuth('admin_456', ['admin']) };
      const res = mockRes();
      await userProfileController.getUserProfile(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('returns 403 for unauthorized user', async () => {
      const req = { params: { clerkUserId: 'user_abc123' }, auth: makeAuth('other_user') };
      const res = mockRes();
      await userProfileController.getUserProfile(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('updatePreferences', () => {
    test('returns 200 on success', async () => {
      userProfileService.updatePreferences.mockResolvedValue(MOCK_PROFILE);
      const req = { params: { clerkUserId: 'user_abc123' }, auth: makeAuth('user_abc123'), body: { preferences: {} } };
      const res = mockRes();
      await userProfileController.updatePreferences(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('returns 403 for unauthorized', async () => {
      const req = { params: { clerkUserId: 'user_abc123' }, auth: makeAuth('other_user'), body: {} };
      const res = mockRes();
      await userProfileController.updatePreferences(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('updateProfile', () => {
    test('returns 200 on success', async () => {
      userProfileService.updateProfile.mockResolvedValue(MOCK_PROFILE);
      const req = { params: { clerkUserId: 'user_abc123' }, auth: makeAuth('user_abc123'), body: { displayName: 'New' } };
      const res = mockRes();
      await userProfileController.updateProfile(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('returns 403 for unauthorized', async () => {
      const req = { params: { clerkUserId: 'user_abc123' }, auth: makeAuth('other_user'), body: {} };
      const res = mockRes();
      await userProfileController.updateProfile(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getListeningHistory', () => {
    test('returns 200 with history', async () => {
      userProfileService.getListeningHistory.mockResolvedValue({ history: [], totalListeningTime: 0, pagination: {} });
      const req = { params: { clerkUserId: 'user_abc123' }, auth: makeAuth('user_abc123'), query: {} };
      const res = mockRes();
      await userProfileController.getListeningHistory(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('returns 403 for unauthorized', async () => {
      const req = { params: { clerkUserId: 'user_abc123' }, auth: makeAuth('other_user'), query: {} };
      const res = mockRes();
      await userProfileController.getListeningHistory(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('addToHistory', () => {
    test('returns 200 when adding own history', async () => {
      userProfileService.addToHistory.mockResolvedValue({ message: 'History updated' });
      const req = { params: { clerkUserId: 'user_abc123' }, auth: makeAuth('user_abc123'), body: { songId: 'song1', duration: 180 } };
      const res = mockRes();
      await userProfileController.addToHistory(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('returns 403 for other user', async () => {
      const req = { params: { clerkUserId: 'user_abc123' }, auth: makeAuth('other_user'), body: {} };
      const res = mockRes();
      await userProfileController.addToHistory(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getUserPreferences (internal)', () => {
    test('returns 200 with preferences', async () => {
      userProfileService.getUserPreferences.mockResolvedValue({ preferences: {}, recentSongIds: [] });
      const req = { params: { clerkUserId: 'user_abc123' } };
      const res = mockRes();
      await userProfileController.getUserPreferences(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getFavorites', () => {
    test('returns 200 with favorites', async () => {
      userProfileService.getFavorites.mockResolvedValue({ favoriteSongIds: ['song1'] });
      const req = { params: { clerkUserId: 'user_abc123' }, auth: makeAuth('user_abc123') };
      const res = mockRes();
      await userProfileController.getFavorites(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('returns 403 for unauthorized', async () => {
      const req = { params: { clerkUserId: 'user_abc123' }, auth: makeAuth('other_user') };
      const res = mockRes();
      await userProfileController.getFavorites(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('addToFavorites', () => {
    test('returns 200 on success', async () => {
      userProfileService.addToFavorites.mockResolvedValue({ message: 'Added to favorites', favoriteSongIds: ['song1'] });
      const req = { params: { clerkUserId: 'user_abc123', songId: 'song1' }, auth: makeAuth('user_abc123') };
      const res = mockRes();
      await userProfileController.addToFavorites(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('returns 403 for unauthorized', async () => {
      const req = { params: { clerkUserId: 'user_abc123', songId: 'song1' }, auth: makeAuth('other_user') };
      const res = mockRes();
      await userProfileController.addToFavorites(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('removeFromFavorites', () => {
    test('returns 200 on success', async () => {
      userProfileService.removeFromFavorites.mockResolvedValue({ message: 'Removed from favorites', favoriteSongIds: [] });
      const req = { params: { clerkUserId: 'user_abc123', songId: 'song1' }, auth: makeAuth('user_abc123') };
      const res = mockRes();
      await userProfileController.removeFromFavorites(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('returns 403 for unauthorized', async () => {
      const req = { params: { clerkUserId: 'user_abc123', songId: 'song1' }, auth: makeAuth('other_user') };
      const res = mockRes();
      await userProfileController.removeFromFavorites(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
