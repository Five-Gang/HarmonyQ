'use strict';

jest.mock('../../config/logger', () => ({
  error: jest.fn(), warn: jest.fn(), info: jest.fn(), http: jest.fn(), debug: jest.fn(),
}));
jest.mock('../../models/Playlist');
jest.mock('../../utils/songValidator', () => ({ validateSongIds: jest.fn() }));

const Playlist = require('../../models/Playlist');
const { validateSongIds } = require('../../utils/songValidator');
const playlistService = require('../../services/playlistService');

const MOCK_PLAYLIST = {
  _id: '507f1f77bcf86cd799439011',
  name: 'My Playlist',
  clerkUserId: 'user_abc123',
  description: '',
  isPublic: false,
  isActive: true,
  songIds: ['song1', 'song2'],
  followers: [],
  followerCount: 0,
};

const mockDoc = (overrides = {}) => ({
  ...MOCK_PLAYLIST,
  ...overrides,
  save: jest.fn().mockResolvedValue(true),
  toJSON: jest.fn().mockReturnValue({ ...MOCK_PLAYLIST, ...overrides }),
});

describe('PlaylistService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─── createPlaylist ───────────────────────────────────────────────────────────
  describe('createPlaylist', () => {
    test('creates playlist without songs', async () => {
      Playlist.create = jest.fn().mockResolvedValue(MOCK_PLAYLIST);
      const result = await playlistService.createPlaylist(
        { clerkUserId: 'user_abc123', name: 'My Playlist', songIds: [] },
        'token'
      );
      expect(result).toEqual(MOCK_PLAYLIST);
      expect(validateSongIds).not.toHaveBeenCalled();
    });

    test('validates song IDs when provided', async () => {
      validateSongIds.mockResolvedValue(['song1']);
      Playlist.create = jest.fn().mockResolvedValue({ ...MOCK_PLAYLIST, songIds: ['song1'] });
      await playlistService.createPlaylist(
        { clerkUserId: 'user_abc123', name: 'My Playlist', songIds: ['song1'] },
        'token'
      );
      expect(validateSongIds).toHaveBeenCalledWith(['song1'], 'token');
    });
  });

  // ─── getPlaylistById ──────────────────────────────────────────────────────────
  describe('getPlaylistById', () => {
    test('returns public playlist to any user', async () => {
      Playlist.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ ...MOCK_PLAYLIST, isPublic: true, followers: [] }) });
      const result = await playlistService.getPlaylistById(MOCK_PLAYLIST._id, 'other_user');
      expect(result).toMatchObject({ name: 'My Playlist' });
    });

    test('throws 404 when playlist not found', async () => {
      Playlist.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
      await expect(playlistService.getPlaylistById('nonexistent', 'user')).rejects.toMatchObject({ statusCode: 404 });
    });

    test('throws 403 for private playlist accessed by non-owner', async () => {
      Playlist.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ ...MOCK_PLAYLIST, isPublic: false, followers: [] }) });
      await expect(playlistService.getPlaylistById(MOCK_PLAYLIST._id, 'other_user')).rejects.toMatchObject({ statusCode: 403 });
    });

    test('sets isFollowing flag correctly', async () => {
      Playlist.findOne = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ ...MOCK_PLAYLIST, isPublic: true, followers: ['user_abc123'] }),
      });
      const result = await playlistService.getPlaylistById(MOCK_PLAYLIST._id, 'user_abc123');
      expect(result.isFollowing).toBe(true);
    });
  });

  // ─── getUserPlaylists ─────────────────────────────────────────────────────────
  describe('getUserPlaylists', () => {
    test('returns all playlists for own user', async () => {
      Playlist.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(), skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([MOCK_PLAYLIST]),
      });
      Playlist.countDocuments = jest.fn().mockResolvedValue(1);
      const result = await playlistService.getUserPlaylists('user_abc123', 'user_abc123');
      expect(result.playlists).toHaveLength(1);
    });

    test('filters to public only for other users', async () => {
      Playlist.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(), skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([]),
      });
      Playlist.countDocuments = jest.fn().mockResolvedValue(0);
      await playlistService.getUserPlaylists('user_abc123', 'other_user');
      expect(Playlist.find).toHaveBeenCalledWith(expect.objectContaining({ isPublic: true }));
    });
  });

  // ─── updatePlaylist ───────────────────────────────────────────────────────────
  describe('updatePlaylist', () => {
    test('updates playlist fields', async () => {
      const doc = mockDoc();
      Playlist.findOne = jest.fn().mockResolvedValue(doc);
      const result = await playlistService.updatePlaylist(MOCK_PLAYLIST._id, 'user_abc123', { name: 'New Name' });
      expect(doc.save).toHaveBeenCalled();
    });

    test('throws 404 when not found', async () => {
      Playlist.findOne = jest.fn().mockResolvedValue(null);
      await expect(playlistService.updatePlaylist('nonexistent', 'user', {})).rejects.toMatchObject({ statusCode: 404 });
    });

    test('throws 403 when not owner', async () => {
      Playlist.findOne = jest.fn().mockResolvedValue(mockDoc());
      await expect(playlistService.updatePlaylist(MOCK_PLAYLIST._id, 'other_user', {})).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  // ─── deletePlaylist ───────────────────────────────────────────────────────────
  describe('deletePlaylist', () => {
    test('soft-deletes and returns message', async () => {
      const doc = mockDoc();
      Playlist.findOne = jest.fn().mockResolvedValue(doc);
      const result = await playlistService.deletePlaylist(MOCK_PLAYLIST._id, 'user_abc123');
      expect(result.message).toBe('Playlist deleted successfully');
      expect(doc.isActive).toBe(false);
    });

    test('throws 403 when not owner', async () => {
      Playlist.findOne = jest.fn().mockResolvedValue(mockDoc());
      await expect(playlistService.deletePlaylist(MOCK_PLAYLIST._id, 'other_user')).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  // ─── addSongs ────────────────────────────────────────────────────────────────
  describe('addSongs', () => {
    test('adds new songs to playlist', async () => {
      const doc = mockDoc({ songIds: ['existing'] });
      Playlist.findOne = jest.fn().mockResolvedValue(doc);
      validateSongIds.mockResolvedValue(['song_new']);
      await playlistService.addSongs(MOCK_PLAYLIST._id, 'user_abc123', ['song_new'], 'token');
      expect(doc.songIds).toContain('song_new');
    });

    test('throws 409 when all songs already in playlist', async () => {
      const doc = mockDoc({ songIds: ['song1'] });
      Playlist.findOne = jest.fn().mockResolvedValue(doc);
      validateSongIds.mockResolvedValue(['song1']);
      await expect(playlistService.addSongs(MOCK_PLAYLIST._id, 'user_abc123', ['song1'], 'token')).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  // ─── removeSong ──────────────────────────────────────────────────────────────
  describe('removeSong', () => {
    test('removes specified song from playlist', async () => {
      const doc = mockDoc({ songIds: ['song1', 'song2'] });
      Playlist.findOne = jest.fn().mockResolvedValue(doc);
      await playlistService.removeSong(MOCK_PLAYLIST._id, 'user_abc123', 'song1');
      expect(doc.songIds).not.toContain('song1');
    });
  });

  // ─── getUserPlaylistSongIds ───────────────────────────────────────────────────
  describe('getUserPlaylistSongIds', () => {
    test('returns deduplicated song IDs', async () => {
      Playlist.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ songIds: ['s1', 's2'] }, { songIds: ['s2', 's3'] }]),
      });
      const result = await playlistService.getUserPlaylistSongIds('user_abc123');
      expect(result).toEqual(['s1', 's2', 's3']);
    });
  });

  // ─── followPlaylist ───────────────────────────────────────────────────────────
  describe('followPlaylist', () => {
    test('follows playlist and increments followerCount', async () => {
      const doc = mockDoc({ followers: [], followerCount: 0 });
      Playlist.findById = jest.fn().mockResolvedValue(doc);
      const result = await playlistService.followPlaylist(MOCK_PLAYLIST._id, 'user_abc123');
      expect(result.followerCount).toBe(1);
      expect(doc.followers).toContain('user_abc123');
    });

    test('throws error when already following', async () => {
      const doc = mockDoc({ followers: ['user_abc123'] });
      Playlist.findById = jest.fn().mockResolvedValue(doc);
      await expect(playlistService.followPlaylist(MOCK_PLAYLIST._id, 'user_abc123')).rejects.toThrow('Already following');
    });
  });

  // ─── unfollowPlaylist ─────────────────────────────────────────────────────────
  describe('unfollowPlaylist', () => {
    test('unfollows playlist and decrements followerCount', async () => {
      const doc = mockDoc({ followers: ['user_abc123'], followerCount: 1 });
      Playlist.findById = jest.fn().mockResolvedValue(doc);
      const result = await playlistService.unfollowPlaylist(MOCK_PLAYLIST._id, 'user_abc123');
      expect(result.followerCount).toBe(0);
    });

    test('throws error when not following', async () => {
      const doc = mockDoc({ followers: [] });
      Playlist.findById = jest.fn().mockResolvedValue(doc);
      await expect(playlistService.unfollowPlaylist(MOCK_PLAYLIST._id, 'user_abc123')).rejects.toThrow('Not following');
    });
  });
});
