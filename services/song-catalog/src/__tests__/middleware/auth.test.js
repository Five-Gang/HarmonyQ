'use strict';

jest.mock('../../config/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
  debug: jest.fn(),
}));

// Mock jwks-rsa and jsonwebtoken before requiring auth
jest.mock('jwks-rsa', () => {
  return jest.fn(() => ({
    getSigningKey: jest.fn((kid, cb) => cb(null, { getPublicKey: () => 'mock-public-key' })),
  }));
});

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const { authenticate, requireAdmin } = require('../../middleware/auth');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authenticate middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 401 when no Authorization header', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when Authorization header does not start with Bearer', () => {
    const req = { headers: { authorization: 'Basic abc123' } };
    const res = mockRes();
    const next = jest.fn();
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 401 when JWT verification fails', () => {
    const req = { headers: { authorization: 'Bearer invalid-token' } };
    const res = mockRes();
    const next = jest.fn();
    jwt.verify.mockImplementation((token, getKey, options, cb) => cb(new Error('invalid token'), null));
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid or expired token' }));
  });

  test('calls next() and sets req.auth on valid JWT', () => {
    const req = { headers: { authorization: 'Bearer valid-token' } };
    const res = mockRes();
    const next = jest.fn();
    const decoded = { sub: 'user_123', sid: 'session_abc', publicMetadata: { roles: ['admin'] } };
    jwt.verify.mockImplementation((token, getKey, options, cb) => cb(null, decoded));
    authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.auth).toEqual({ userId: 'user_123', sessionId: 'session_abc', roles: ['admin'] });
  });

  test('sets empty roles when no role metadata in JWT', () => {
    const req = { headers: { authorization: 'Bearer valid-token' } };
    const res = mockRes();
    const next = jest.fn();
    const decoded = { sub: 'user_123', sid: 'session_abc' };
    jwt.verify.mockImplementation((token, getKey, options, cb) => cb(null, decoded));
    authenticate(req, res, next);
    expect(req.auth.roles).toEqual([]);
  });

  test('extracts roles from public_metadata (snake_case)', () => {
    const req = { headers: { authorization: 'Bearer valid-token' } };
    const res = mockRes();
    const next = jest.fn();
    const decoded = { sub: 'user_123', sid: 'session_abc', public_metadata: { roles: ['user'] } };
    jwt.verify.mockImplementation((token, getKey, options, cb) => cb(null, decoded));
    authenticate(req, res, next);
    expect(req.auth.roles).toEqual(['user']);
  });

  test('extracts roles from top-level roles array', () => {
    const req = { headers: { authorization: 'Bearer valid-token' } };
    const res = mockRes();
    const next = jest.fn();
    const decoded = { sub: 'user_123', sid: 'session_abc', roles: ['user', 'admin'] };
    jwt.verify.mockImplementation((token, getKey, options, cb) => cb(null, decoded));
    authenticate(req, res, next);
    expect(req.auth.roles).toEqual(['user', 'admin']);
  });
});

describe('requireAdmin middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 403 when user is not admin', () => {
    const req = { auth: { roles: ['user'] } };
    const res = mockRes();
    const next = jest.fn();
    requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when req.auth is missing', () => {
    const req = {};
    const res = mockRes();
    const next = jest.fn();
    requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('calls next() when user has admin role', () => {
    const req = { auth: { roles: ['admin'] } };
    const res = mockRes();
    const next = jest.fn();
    requireAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
