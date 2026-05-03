'use strict';

jest.mock('../../config/logger', () => ({
  error: jest.fn(), warn: jest.fn(), info: jest.fn(), http: jest.fn(), debug: jest.fn(),
}));

const UserProfile = require('../../models/UserProfile');

describe('UserProfile Model', () => {
  describe('listeningHistoryCount virtual', () => {
    test('returns 0 when history is empty', () => {
      const profile = new UserProfile({ clerkUserId: 'u1', email: 'a@b.com' });
      expect(profile.listeningHistoryCount).toBe(0);
    });

    test('returns correct count with history entries', () => {
      const profile = new UserProfile({
        clerkUserId: 'u1',
        email: 'a@b.com',
        listeningHistory: [
          { songId: 's1', duration: 100 },
          { songId: 's2', duration: 200 },
        ],
      });
      expect(profile.listeningHistoryCount).toBe(2);
    });
  });

  describe('default values', () => {
    test('displayName defaults to empty string', () => {
      const p = new UserProfile({ clerkUserId: 'u1', email: 'a@b.com' });
      expect(p.displayName).toBe('');
    });

    test('role defaults to user', () => {
      const p = new UserProfile({ clerkUserId: 'u1', email: 'a@b.com' });
      expect(p.role).toBe('user');
    });

    test('isActive defaults to true', () => {
      const p = new UserProfile({ clerkUserId: 'u1', email: 'a@b.com' });
      expect(p.isActive).toBe(true);
    });

    test('totalListeningTime defaults to 0', () => {
      const p = new UserProfile({ clerkUserId: 'u1', email: 'a@b.com' });
      expect(p.totalListeningTime).toBe(0);
    });

    test('favoriteSongIds defaults to empty array', () => {
      const p = new UserProfile({ clerkUserId: 'u1', email: 'a@b.com' });
      expect(p.favoriteSongIds).toEqual([]);
    });

    test('preferences.theme defaults to dark', () => {
      const p = new UserProfile({ clerkUserId: 'u1', email: 'a@b.com' });
      expect(p.preferences.theme).toBe('dark');
    });
  });

  describe('schema validation', () => {
    test('clerkUserId is required', () => {
      const p = new UserProfile({ email: 'a@b.com' });
      const err = p.validateSync();
      expect(err.errors.clerkUserId).toBeDefined();
    });

    test('email is required', () => {
      const p = new UserProfile({ clerkUserId: 'u1' });
      const err = p.validateSync();
      expect(err.errors.email).toBeDefined();
    });

    test('role must be user or admin', () => {
      const p = new UserProfile({ clerkUserId: 'u1', email: 'a@b.com', role: 'superuser' });
      const err = p.validateSync();
      expect(err.errors.role).toBeDefined();
    });

    test('valid profile passes validation', () => {
      const p = new UserProfile({ clerkUserId: 'u1', email: 'a@b.com' });
      expect(p.validateSync()).toBeUndefined();
    });

    test('admin role is valid', () => {
      const p = new UserProfile({ clerkUserId: 'u1', email: 'a@b.com', role: 'admin' });
      expect(p.validateSync()).toBeUndefined();
    });

    test('theme must be dark light or system', () => {
      const p = new UserProfile({ clerkUserId: 'u1', email: 'a@b.com', preferences: { theme: 'invalid' } });
      const err = p.validateSync();
      expect(err.errors['preferences.theme']).toBeDefined();
    });
  });
});
