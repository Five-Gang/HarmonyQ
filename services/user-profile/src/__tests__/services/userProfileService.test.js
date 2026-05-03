'use strict';

jest.mock('../../config/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
  debug: jest.fn(),
}));

jest.mock('../../models/UserProfile');
const UserProfile = require('../../models/UserProfile');
const userProfileService = require('../../services/userProfileService');

const MOCK_PROFILE = {
  _id: '507f1f77bcf86cd799439011',
  clerkUserId: 'user_abc123',
  email: 'test@example.com',
  displayName: 'Test User',
  preferences: { favoriteGenres: ['Pop'], favoriteArtists: [], isPublicProfile: true },
  listeningHistory: [],
  favoriteSongIds: [],
  isActive: true,
};

describe('UserProfileService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─── syncUser ─────────────────────────────────────────────────────────────────
  describe('syncUser', () => {
    test('upserts user profile and returns it', async () => {
      UserProfile.findOneAndUpdate = jest.fn().mockResolvedValue(MOCK_PROFILE);
      const result = await userProfileService.syncUser({ clerkUserId: 'user_abc123', email: 'test@example.com', displayName: 'Test User', avatar: null });
      expect(result).toEqual(MOCK_PROFILE);
      expect(UserProfile.findOneAndUpdate).toHaveBeenCalledTimes(1);
    });
  });

  // ─── getUserProfile ──────────────────────────────────────────────────────────
  describe('getUserProfile', () => {
    test('returns profile when found', async () => {
      UserProfile.findOne = jest.fn().mockReturnValue({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(MOCK_PROFILE) });
      const result = await userProfileService.getUserProfile('user_abc123');
      expect(result).toEqual(MOCK_PROFILE);
    });

    test('throws 404 when profile not found', async () => {
      UserProfile.findOne = jest.fn().mockReturnValue({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(null) });
      await expect(userProfileService.getUserProfile('nonexistent')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── updatePreferences ───────────────────────────────────────────────────────
  describe('updatePreferences', () => {
    test('returns updated profile', async () => {
      const updated = { ...MOCK_PROFILE, preferences: { favoriteGenres: ['Rock'] } };
      UserProfile.findOneAndUpdate = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(updated) });
      const result = await userProfileService.updatePreferences('user_abc123', { favoriteGenres: ['Rock'] });
      expect(result.preferences.favoriteGenres).toContain('Rock');
    });

    test('throws 404 when profile not found', async () => {
      UserProfile.findOneAndUpdate = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
      await expect(userProfileService.updatePreferences('nonexistent', {})).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── updateProfile ───────────────────────────────────────────────────────────
  describe('updateProfile', () => {
    test('updates displayName and bio', async () => {
      const updated = { ...MOCK_PROFILE, displayName: 'New Name', bio: 'New Bio' };
      UserProfile.findOneAndUpdate = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(updated) });
      const result = await userProfileService.updateProfile('user_abc123', { displayName: 'New Name', bio: 'New Bio' });
      expect(result.displayName).toBe('New Name');
    });

    test('throws 404 when profile not found', async () => {
      UserProfile.findOneAndUpdate = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
      await expect(userProfileService.updateProfile('nonexistent', {})).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── getListeningHistory ─────────────────────────────────────────────────────
  describe('getListeningHistory', () => {
    test('returns paginated history', async () => {
      const profileWithHistory = {
        ...MOCK_PROFILE,
        listeningHistory: [
          { songId: 'song1', playedAt: new Date('2024-01-02'), duration: 180 },
          { songId: 'song2', playedAt: new Date('2024-01-01'), duration: 240 },
        ],
        totalListeningTime: 420,
      };
      UserProfile.findOne = jest.fn().mockReturnValue({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(profileWithHistory) });
      const result = await userProfileService.getListeningHistory('user_abc123', { page: 1, limit: 10 });
      expect(result.history).toHaveLength(2);
      expect(result.totalListeningTime).toBe(420);
    });

    test('throws 404 when profile not found', async () => {
      UserProfile.findOne = jest.fn().mockReturnValue({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(null) });
      await expect(userProfileService.getListeningHistory('nonexistent')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── addToHistory ────────────────────────────────────────────────────────────
  describe('addToHistory', () => {
    test('returns success message', async () => {
      UserProfile.findOneAndUpdate = jest.fn().mockResolvedValue(MOCK_PROFILE);
      const result = await userProfileService.addToHistory('user_abc123', { songId: 'song1', duration: 180 });
      expect(result.message).toBe('History updated');
    });

    test('throws 404 when profile not found', async () => {
      UserProfile.findOneAndUpdate = jest.fn().mockResolvedValue(null);
      await expect(userProfileService.addToHistory('nonexistent', { songId: 's1', duration: 0 })).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── getUserPreferences ──────────────────────────────────────────────────────
  describe('getUserPreferences', () => {
    test('returns preferences and recent song IDs', async () => {
      const profileWithHistory = {
        ...MOCK_PROFILE,
        listeningHistory: [{ songId: 'song1', playedAt: new Date(), duration: 180 }],
      };
      UserProfile.findOne = jest.fn().mockReturnValue({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(profileWithHistory) });
      const result = await userProfileService.getUserPreferences('user_abc123');
      expect(result).toHaveProperty('preferences');
      expect(result).toHaveProperty('recentSongIds');
      expect(result.recentSongIds).toContain('song1');
    });

    test('returns null when profile not found', async () => {
      UserProfile.findOne = jest.fn().mockReturnValue({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(null) });
      const result = await userProfileService.getUserPreferences('nonexistent');
      expect(result).toBeNull();
    });
  });

  // ─── getFavorites ────────────────────────────────────────────────────────────
  describe('getFavorites', () => {
    test('returns favorite song IDs', async () => {
      const profileWithFavorites = { ...MOCK_PROFILE, favoriteSongIds: ['song1', 'song2'] };
      UserProfile.findOne = jest.fn().mockReturnValue({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(profileWithFavorites) });
      const result = await userProfileService.getFavorites('user_abc123');
      expect(result.favoriteSongIds).toEqual(['song1', 'song2']);
    });

    test('throws 404 when profile not found', async () => {
      UserProfile.findOne = jest.fn().mockReturnValue({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(null) });
      await expect(userProfileService.getFavorites('nonexistent')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── addToFavorites ──────────────────────────────────────────────────────────
  describe('addToFavorites', () => {
    test('returns updated favorites', async () => {
      const updated = { ...MOCK_PROFILE, favoriteSongIds: ['song1'] };
      UserProfile.findOneAndUpdate = jest.fn().mockResolvedValue(updated);
      const result = await userProfileService.addToFavorites('user_abc123', 'song1');
      expect(result.message).toBe('Added to favorites');
    });

    test('throws 404 when profile not found', async () => {
      UserProfile.findOneAndUpdate = jest.fn().mockResolvedValue(null);
      await expect(userProfileService.addToFavorites('nonexistent', 'song1')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── removeFromFavorites ─────────────────────────────────────────────────────
  describe('removeFromFavorites', () => {
    test('returns updated favorites after removal', async () => {
      const updated = { ...MOCK_PROFILE, favoriteSongIds: [] };
      UserProfile.findOneAndUpdate = jest.fn().mockResolvedValue(updated);
      const result = await userProfileService.removeFromFavorites('user_abc123', 'song1');
      expect(result.message).toBe('Removed from favorites');
    });

    test('throws 404 when profile not found', async () => {
      UserProfile.findOneAndUpdate = jest.fn().mockResolvedValue(null);
      await expect(userProfileService.removeFromFavorites('nonexistent', 'song1')).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
