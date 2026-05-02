'use strict';

jest.mock('../../config/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
  debug: jest.fn(),
}));

jest.mock('../../services/songService');
jest.mock('../../config/cloudinary', () => ({ uploadToCloudinary: jest.fn() }));
jest.mock('../../config/azure', () => ({ uploadToAzure: jest.fn() }));

const songService = require('../../services/songService');
const { uploadToCloudinary } = require('../../config/cloudinary');
const { uploadToAzure } = require('../../config/azure');
const songController = require('../../controllers/songController');

const MOCK_SONG = {
  _id: '507f1f77bcf86cd799439011',
  title: 'Test Song',
  artist: 'Test Artist',
  genre: 'Pop',
  duration: 180,
  releaseYear: 2023,
};

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('SongController', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─── getAllSongs ──────────────────────────────────────────────────────────────
  describe('getAllSongs', () => {
    test('responds 200 with song list', async () => {
      songService.getSongs.mockResolvedValue({ songs: [MOCK_SONG], pagination: { page: 1, limit: 20, total: 1 } });
      const req = { query: {} };
      const res = mockRes();
      await songController.getAllSongs(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('calls next on error', async () => {
      songService.getSongs.mockRejectedValue(new Error('DB error'));
      const next = jest.fn();
      await songController.getAllSongs({ query: {} }, mockRes(), next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ─── getSongById ─────────────────────────────────────────────────────────────
  describe('getSongById', () => {
    test('responds 200 with song data', async () => {
      songService.getSongById.mockResolvedValue(MOCK_SONG);
      const req = { params: { id: MOCK_SONG._id } };
      const res = mockRes();
      await songController.getSongById(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: MOCK_SONG }));
    });

    test('calls next on error', async () => {
      songService.getSongById.mockRejectedValue(new Error('not found'));
      const next = jest.fn();
      await songController.getSongById({ params: { id: 'bad' } }, mockRes(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  // ─── getSongsByIds ───────────────────────────────────────────────────────────
  describe('getSongsByIds', () => {
    test('responds 200 with songs', async () => {
      songService.getSongsByIds.mockResolvedValue([MOCK_SONG]);
      const req = { body: { ids: [MOCK_SONG._id] } };
      const res = mockRes();
      await songController.getSongsByIds(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ─── createSong ──────────────────────────────────────────────────────────────
  describe('createSong', () => {
    test('creates song without file uploads', async () => {
      songService.createSong.mockResolvedValue(MOCK_SONG);
      const req = { body: { title: 'Test', artist: 'Artist', genre: 'Pop', duration: 180, releaseYear: 2023 }, files: null };
      const res = mockRes();
      await songController.createSong(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('uploads cover image to Cloudinary when file provided', async () => {
      uploadToCloudinary.mockResolvedValue({ secure_url: 'https://cloudinary.com/cover.jpg' });
      songService.createSong.mockResolvedValue({ ...MOCK_SONG, coverUrl: 'https://cloudinary.com/cover.jpg' });
      const req = {
        body: { title: 'Test', artist: 'Artist', genre: 'Pop', duration: 180, releaseYear: 2023 },
        files: { coverImage: [{ buffer: Buffer.from('img'), mimetype: 'image/jpeg', originalname: 'cover.jpg' }] },
      };
      const res = mockRes();
      await songController.createSong(req, res, jest.fn());
      expect(uploadToCloudinary).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('uploads audio to Azure when file provided', async () => {
      uploadToAzure.mockResolvedValue('https://azure.com/song.mp3');
      songService.createSong.mockResolvedValue({ ...MOCK_SONG, songUrl: 'https://azure.com/song.mp3' });
      const req = {
        body: { title: 'Test', artist: 'Artist', genre: 'Pop', duration: 180, releaseYear: 2023 },
        files: { audioFile: [{ buffer: Buffer.from('mp3'), mimetype: 'audio/mpeg', originalname: 'song.mp3' }] },
      };
      const res = mockRes();
      await songController.createSong(req, res, jest.fn());
      expect(uploadToAzure).toHaveBeenCalled();
    });

    test('warns and continues when Cloudinary upload fails', async () => {
      uploadToCloudinary.mockRejectedValue(new Error('Cloudinary error'));
      songService.createSong.mockResolvedValue(MOCK_SONG);
      const req = {
        body: { title: 'Test', genre: 'Pop', artist: 'Artist', duration: 180, releaseYear: 2023 },
        files: { coverImage: [{ buffer: Buffer.from('img') }] },
      };
      const res = mockRes();
      await songController.createSong(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('parses JSON-stringified genre array', async () => {
      songService.createSong.mockResolvedValue(MOCK_SONG);
      const req = { body: { title: 'Test', artist: 'Artist', genre: '["Pop"]', duration: 180, releaseYear: 2023 }, files: null };
      const res = mockRes();
      await songController.createSong(req, res, jest.fn());
      expect(songService.createSong).toHaveBeenCalledWith(expect.objectContaining({ genre: 'Pop' }));
    });

    test('handles array genre by taking first element', async () => {
      songService.createSong.mockResolvedValue(MOCK_SONG);
      const req = { body: { title: 'Test', artist: 'Artist', genre: ['Pop', 'Rock'], duration: 180, releaseYear: 2023 }, files: null };
      const res = mockRes();
      await songController.createSong(req, res, jest.fn());
      expect(songService.createSong).toHaveBeenCalledWith(expect.objectContaining({ genre: 'Pop' }));
    });
  });

  // ─── updateSong ──────────────────────────────────────────────────────────────
  describe('updateSong', () => {
    test('responds 200 with updated song', async () => {
      songService.updateSong.mockResolvedValue({ ...MOCK_SONG, title: 'Updated' });
      const req = { params: { id: MOCK_SONG._id }, body: { title: 'Updated' } };
      const res = mockRes();
      await songController.updateSong(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ─── deleteSong ──────────────────────────────────────────────────────────────
  describe('deleteSong', () => {
    test('responds 200 with success message', async () => {
      songService.deleteSong.mockResolvedValue({ message: 'Song deleted successfully' });
      const req = { params: { id: MOCK_SONG._id } };
      const res = mockRes();
      await songController.deleteSong(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ─── getTrendingSongs ────────────────────────────────────────────────────────
  describe('getTrendingSongs', () => {
    test('responds 200 with trending songs', async () => {
      songService.getTrendingSongs.mockResolvedValue([MOCK_SONG]);
      const req = { query: { limit: '10' } };
      const res = mockRes();
      await songController.getTrendingSongs(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('defaults limit to 10 when not provided', async () => {
      songService.getTrendingSongs.mockResolvedValue([]);
      const req = { query: {} };
      const res = mockRes();
      await songController.getTrendingSongs(req, res, jest.fn());
      expect(songService.getTrendingSongs).toHaveBeenCalledWith(10);
    });
  });

  // ─── getSongsByGenres ────────────────────────────────────────────────────────
  describe('getSongsByGenres', () => {
    test('responds 200 with songs by genres', async () => {
      songService.getSongsByGenres.mockResolvedValue([MOCK_SONG]);
      const req = { body: { genres: ['Pop'], limit: 10 } };
      const res = mockRes();
      await songController.getSongsByGenres(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ─── incrementPlayCount ──────────────────────────────────────────────────────
  describe('incrementPlayCount', () => {
    test('responds 200 with play count updated message', async () => {
      songService.incrementPlayCount.mockResolvedValue(undefined);
      const req = { params: { id: MOCK_SONG._id } };
      const res = mockRes();
      await songController.incrementPlayCount(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Play count updated' }));
    });
  });
});
