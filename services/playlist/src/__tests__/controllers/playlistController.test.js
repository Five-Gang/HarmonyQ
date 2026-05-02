'use strict';

jest.mock('../../config/logger', () => ({
  error: jest.fn(), warn: jest.fn(), info: jest.fn(), http: jest.fn(), debug: jest.fn(),
}));
jest.mock('../../services/playlistService');

const playlistService = require('../../services/playlistService');
const playlistController = require('../../controllers/playlistController');

const MOCK_PLAYLIST = {
  _id: '507f1f77bcf86cd799439011',
  name: 'My Playlist',
  clerkUserId: 'user_abc123',
  isPublic: true,
};

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('PlaylistController', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createPlaylist', () => {
    test('responds 201 on success', async () => {
      playlistService.createPlaylist.mockResolvedValue(MOCK_PLAYLIST);
      const req = { body: { name: 'My Playlist' }, auth: { userId: 'user_abc123' }, headers: { authorization: 'Bearer token' } };
      const res = mockRes();
      await playlistController.createPlaylist(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('calls next on error', async () => {
      playlistService.createPlaylist.mockRejectedValue(new Error('fail'));
      const next = jest.fn();
      await playlistController.createPlaylist({ body: {}, auth: { userId: 'u' }, headers: {} }, mockRes(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getPlaylistById', () => {
    test('responds 200 with playlist', async () => {
      playlistService.getPlaylistById.mockResolvedValue(MOCK_PLAYLIST);
      const req = { params: { id: MOCK_PLAYLIST._id }, auth: { userId: 'user_abc123' } };
      const res = mockRes();
      await playlistController.getPlaylistById(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getUserPlaylists', () => {
    test('responds 200', async () => {
      playlistService.getUserPlaylists.mockResolvedValue({ playlists: [], pagination: {} });
      const req = { params: { clerkUserId: 'user_abc123' }, auth: { userId: 'user_abc123' }, query: {} };
      const res = mockRes();
      await playlistController.getUserPlaylists(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getPublicPlaylists', () => {
    test('responds 200', async () => {
      playlistService.getPublicPlaylists.mockResolvedValue({ playlists: [], pagination: {} });
      const req = { auth: { userId: 'user_abc123' }, query: {} };
      const res = mockRes();
      await playlistController.getPublicPlaylists(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updatePlaylist', () => {
    test('responds 200 on success', async () => {
      playlistService.updatePlaylist.mockResolvedValue(MOCK_PLAYLIST);
      const req = { params: { id: MOCK_PLAYLIST._id }, auth: { userId: 'user_abc123' }, body: { name: 'New' } };
      const res = mockRes();
      await playlistController.updatePlaylist(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deletePlaylist', () => {
    test('responds 200 on success', async () => {
      playlistService.deletePlaylist.mockResolvedValue({ message: 'Playlist deleted successfully' });
      const req = { params: { id: MOCK_PLAYLIST._id }, auth: { userId: 'user_abc123' } };
      const res = mockRes();
      await playlistController.deletePlaylist(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('addSongs', () => {
    test('responds 200 on success', async () => {
      playlistService.addSongs.mockResolvedValue(MOCK_PLAYLIST);
      const req = { params: { id: MOCK_PLAYLIST._id }, auth: { userId: 'user_abc123' }, body: { songIds: ['s1'] }, headers: { authorization: 'Bearer token' } };
      const res = mockRes();
      await playlistController.addSongs(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('removeSong', () => {
    test('responds 200 on success', async () => {
      playlistService.removeSong.mockResolvedValue(MOCK_PLAYLIST);
      const req = { params: { id: MOCK_PLAYLIST._id, songId: 'song1' }, auth: { userId: 'user_abc123' } };
      const res = mockRes();
      await playlistController.removeSong(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('reorderSongs', () => {
    test('responds 200 on success', async () => {
      playlistService.reorderSongs.mockResolvedValue(MOCK_PLAYLIST);
      const req = { params: { id: MOCK_PLAYLIST._id }, auth: { userId: 'user_abc123' }, body: { songIds: ['s1', 's2'] } };
      const res = mockRes();
      await playlistController.reorderSongs(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('followPlaylist', () => {
    test('responds 200 on success', async () => {
      playlistService.followPlaylist.mockResolvedValue({ success: true, followerCount: 1 });
      const req = { params: { id: MOCK_PLAYLIST._id }, auth: { userId: 'user_abc123' } };
      const res = mockRes();
      await playlistController.followPlaylist(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('unfollowPlaylist', () => {
    test('responds 200 on success', async () => {
      playlistService.unfollowPlaylist.mockResolvedValue({ success: true, followerCount: 0 });
      const req = { params: { id: MOCK_PLAYLIST._id }, auth: { userId: 'user_abc123' } };
      const res = mockRes();
      await playlistController.unfollowPlaylist(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getFollowingPlaylists', () => {
    test('responds 200 on success', async () => {
      playlistService.getFollowingPlaylists.mockResolvedValue({ playlists: [], pagination: {} });
      const req = { auth: { userId: 'user_abc123' }, query: {} };
      const res = mockRes();
      await playlistController.getFollowingPlaylists(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getUserPlaylistSongIds (internal)', () => {
    test('responds 200 with song IDs', async () => {
      playlistService.getUserPlaylistSongIds.mockResolvedValue(['s1', 's2']);
      const req = { params: { clerkUserId: 'user_abc123' } };
      const res = mockRes();
      await playlistController.getUserPlaylistSongIds(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getAllPlaylistsAdmin', () => {
    test('responds 200 with admin playlist list', async () => {
      playlistService.getAllPlaylistsAdmin.mockResolvedValue({ playlists: [], pagination: {} });
      const req = { query: {} };
      const res = mockRes();
      await playlistController.getAllPlaylistsAdmin(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deletePlaylistPermanently', () => {
    test('responds 200 for owner', async () => {
      playlistService.deletePlaylistPermanently.mockResolvedValue({ message: 'Playlist permanently deleted' });
      const req = { params: { id: MOCK_PLAYLIST._id }, auth: { userId: 'user_abc123', roles: [] } };
      const res = mockRes();
      await playlistController.deletePlaylistPermanently(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
