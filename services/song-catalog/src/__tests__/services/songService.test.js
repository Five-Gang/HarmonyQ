'use strict';

jest.mock('../../config/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
  debug: jest.fn(),
}));

// Mock Song model
jest.mock('../../models/Song');
const Song = require('../../models/Song');
const songService = require('../../services/songService');

const MOCK_SONG = {
  _id: '507f1f77bcf86cd799439011',
  title: 'Test Song',
  artist: 'Test Artist',
  genre: 'Pop',
  duration: 180,
  releaseYear: 2023,
  isActive: true,
  playCount: 0,
};

describe('SongService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─── getSongs ────────────────────────────────────────────────────────────────
  describe('getSongs', () => {
    test('returns paginated songs with default params', async () => {
      const fakeSongs = [MOCK_SONG];
      Song.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(fakeSongs),
      });
      Song.countDocuments = jest.fn().mockResolvedValue(1);

      const result = await songService.getSongs({});
      expect(result.songs).toEqual(fakeSongs);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.total).toBe(1);
    });

    test('applies genre filter', async () => {
      Song.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });
      Song.countDocuments = jest.fn().mockResolvedValue(0);

      await songService.getSongs({ genre: 'Rock' });
      expect(Song.find).toHaveBeenCalledWith(expect.objectContaining({ genre: 'Rock' }));
    });

    test('applies text search filter', async () => {
      Song.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });
      Song.countDocuments = jest.fn().mockResolvedValue(0);

      await songService.getSongs({ search: 'blues' });
      expect(Song.find).toHaveBeenCalledWith(expect.objectContaining({ $text: { $search: 'blues' } }));
    });

    test('caps limit at 100', async () => {
      Song.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });
      Song.countDocuments = jest.fn().mockResolvedValue(0);

      const result = await songService.getSongs({ limit: 9999 });
      expect(result.pagination.limit).toBe(100);
    });
  });

  // ─── getSongById ─────────────────────────────────────────────────────────────
  describe('getSongById', () => {
    test('returns song when found', async () => {
      Song.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(MOCK_SONG) });
      const result = await songService.getSongById(MOCK_SONG._id);
      expect(result).toEqual(MOCK_SONG);
    });

    test('throws 404 error when song not found', async () => {
      Song.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
      await expect(songService.getSongById('nonexistent')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── getSongsByIds ───────────────────────────────────────────────────────────
  describe('getSongsByIds', () => {
    test('returns songs matching IDs', async () => {
      Song.find = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([MOCK_SONG]) });
      const result = await songService.getSongsByIds([MOCK_SONG._id]);
      expect(result).toEqual([MOCK_SONG]);
    });
  });

  // ─── createSong ──────────────────────────────────────────────────────────────
  describe('createSong', () => {
    test('creates and returns a song', async () => {
      Song.create = jest.fn().mockResolvedValue(MOCK_SONG);
      const result = await songService.createSong({ title: 'Test Song', artist: 'Test Artist', genre: 'Pop', duration: 180, releaseYear: 2023 });
      expect(result).toEqual(MOCK_SONG);
      expect(Song.create).toHaveBeenCalledTimes(1);
    });
  });

  // ─── updateSong ──────────────────────────────────────────────────────────────
  describe('updateSong', () => {
    test('returns updated song', async () => {
      const updated = { ...MOCK_SONG, title: 'Updated' };
      Song.findOneAndUpdate = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(updated) });
      const result = await songService.updateSong(MOCK_SONG._id, { title: 'Updated' });
      expect(result.title).toBe('Updated');
    });

    test('throws 404 when song not found', async () => {
      Song.findOneAndUpdate = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
      await expect(songService.updateSong('nonexistent', {})).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── deleteSong ──────────────────────────────────────────────────────────────
  describe('deleteSong', () => {
    test('returns success message on delete', async () => {
      Song.findOneAndUpdate = jest.fn().mockResolvedValue(MOCK_SONG);
      const result = await songService.deleteSong(MOCK_SONG._id);
      expect(result.message).toBe('Song deleted successfully');
    });

    test('throws 404 when song not found', async () => {
      Song.findOneAndUpdate = jest.fn().mockResolvedValue(null);
      await expect(songService.deleteSong('nonexistent')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── getTrendingSongs ────────────────────────────────────────────────────────
  describe('getTrendingSongs', () => {
    test('returns trending songs sorted by playCount', async () => {
      Song.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([MOCK_SONG]),
      });
      const result = await songService.getTrendingSongs(10);
      expect(result).toEqual([MOCK_SONG]);
    });
  });

  // ─── getSongsByGenres ────────────────────────────────────────────────────────
  describe('getSongsByGenres', () => {
    test('returns songs filtered by genres', async () => {
      Song.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([MOCK_SONG]),
      });
      const result = await songService.getSongsByGenres(['Pop'], 10);
      expect(result).toEqual([MOCK_SONG]);
      expect(Song.find).toHaveBeenCalledWith(expect.objectContaining({ genre: { $in: ['Pop'] } }));
    });
  });

  // ─── incrementPlayCount ──────────────────────────────────────────────────────
  describe('incrementPlayCount', () => {
    test('calls findByIdAndUpdate with $inc', async () => {
      Song.findByIdAndUpdate = jest.fn().mockResolvedValue(undefined);
      await songService.incrementPlayCount(MOCK_SONG._id);
      expect(Song.findByIdAndUpdate).toHaveBeenCalledWith(MOCK_SONG._id, { $inc: { playCount: 1 } });
    });
  });
});
