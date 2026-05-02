'use strict';

jest.mock('../../config/logger', () => ({
  error: jest.fn(), warn: jest.fn(), info: jest.fn(), http: jest.fn(), debug: jest.fn(),
}));

// Use the real Song schema via mongoose in-memory (no mock)
const mongoose = require('mongoose');

// Import Song after setting up the model (no DB connection needed for schema tests)
// We just need the schema/class, not an active connection
const Song = require('../../models/Song');

describe('Song Model', () => {
  // ─── Virtual: durationFormatted ──────────────────────────────────────────────
  describe('durationFormatted virtual', () => {
    test('formats 0 seconds as 0:00', () => {
      const song = new Song({ title: 'T', artist: 'A', genre: 'Pop', duration: 0, releaseYear: 2020 });
      expect(song.durationFormatted).toBe('0:00');
    });

    test('formats 65 seconds as 1:05', () => {
      const song = new Song({ title: 'T', artist: 'A', genre: 'Pop', duration: 65, releaseYear: 2020 });
      expect(song.durationFormatted).toBe('1:05');
    });

    test('formats 180 seconds as 3:00', () => {
      const song = new Song({ title: 'T', artist: 'A', genre: 'Pop', duration: 180, releaseYear: 2020 });
      expect(song.durationFormatted).toBe('3:00');
    });

    test('formats 3661 seconds as 61:01', () => {
      const song = new Song({ title: 'T', artist: 'A', genre: 'Pop', duration: 3661, releaseYear: 2020 });
      expect(song.durationFormatted).toBe('61:01');
    });
  });

  // ─── Default values ───────────────────────────────────────────────────────────
  describe('default values', () => {
    test('album defaults to Single', () => {
      const song = new Song({ title: 'T', artist: 'A', genre: 'Pop', duration: 180, releaseYear: 2020 });
      expect(song.album).toBe('Single');
    });

    test('playCount defaults to 0', () => {
      const song = new Song({ title: 'T', artist: 'A', genre: 'Pop', duration: 180, releaseYear: 2020 });
      expect(song.playCount).toBe(0);
    });

    test('isActive defaults to true', () => {
      const song = new Song({ title: 'T', artist: 'A', genre: 'Pop', duration: 180, releaseYear: 2020 });
      expect(song.isActive).toBe(true);
    });

    test('songUrl defaults to null', () => {
      const song = new Song({ title: 'T', artist: 'A', genre: 'Pop', duration: 180, releaseYear: 2020 });
      expect(song.songUrl).toBeNull();
    });

    test('coverUrl defaults to null', () => {
      const song = new Song({ title: 'T', artist: 'A', genre: 'Pop', duration: 180, releaseYear: 2020 });
      expect(song.coverUrl).toBeNull();
    });
  });

  // ─── Validation errors ────────────────────────────────────────────────────────
  describe('schema validation', () => {
    test('title is required', () => {
      const song = new Song({ artist: 'A', genre: 'Pop', duration: 180, releaseYear: 2020 });
      const err = song.validateSync();
      expect(err.errors.title).toBeDefined();
    });

    test('artist is required', () => {
      const song = new Song({ title: 'T', genre: 'Pop', duration: 180, releaseYear: 2020 });
      const err = song.validateSync();
      expect(err.errors.artist).toBeDefined();
    });

    test('genre must be in enum', () => {
      const song = new Song({ title: 'T', artist: 'A', genre: 'INVALID', duration: 180, releaseYear: 2020 });
      const err = song.validateSync();
      expect(err.errors.genre).toBeDefined();
    });

    test('duration must be at least 1', () => {
      const song = new Song({ title: 'T', artist: 'A', genre: 'Pop', duration: 0, releaseYear: 2020 });
      const err = song.validateSync();
      expect(err.errors.duration).toBeDefined();
    });

    test('releaseYear must be at least 1900', () => {
      const song = new Song({ title: 'T', artist: 'A', genre: 'Pop', duration: 180, releaseYear: 1800 });
      const err = song.validateSync();
      expect(err.errors.releaseYear).toBeDefined();
    });

    test('valid song passes validation', () => {
      const song = new Song({ title: 'T', artist: 'A', genre: 'Pop', duration: 180, releaseYear: 2020 });
      const err = song.validateSync();
      expect(err).toBeUndefined();
    });

    test('accepts all valid genres', () => {
      const validGenres = ['Pop', 'Rock', 'Hip-Hop', 'R&B', 'Jazz', 'Classical', 'Electronic', 'Country', 'K-Pop', 'Other'];
      validGenres.forEach(genre => {
        const song = new Song({ title: 'T', artist: 'A', genre, duration: 180, releaseYear: 2020 });
        expect(song.validateSync()).toBeUndefined();
      });
    });
  });
});
