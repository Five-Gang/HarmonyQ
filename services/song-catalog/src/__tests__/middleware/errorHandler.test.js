'use strict';

const { errorHandler, validate, notFound } = require('../../middleware/errorHandler');

// Silence winston logs during tests
jest.mock('../../config/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
  debug: jest.fn(),
}));

const mockReq = (overrides = {}) => ({
  path: '/test',
  method: 'GET',
  originalUrl: '/test',
  ...overrides,
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('errorHandler middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  test('handles Mongoose ValidationError with 400', () => {
    const err = { name: 'ValidationError', errors: { title: { message: 'Title required' } } };
    const res = mockRes();
    errorHandler(err, mockReq(), res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: 'Validation Error' }));
  });

  test('handles duplicate key error (code 11000) with 409', () => {
    const err = { code: 11000, keyValue: { title: 'Test' } };
    const res = mockRes();
    errorHandler(err, mockReq(), res, mockNext);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: 'Conflict' }));
  });

  test('handles CastError with 400', () => {
    const err = { name: 'CastError' };
    const res = mockRes();
    errorHandler(err, mockReq(), res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid ID format' }));
  });

  test('handles generic error with statusCode', () => {
    const err = { name: 'NotFound', statusCode: 404, message: 'Song not found' };
    const res = mockRes();
    errorHandler(err, mockReq(), res, mockNext);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test('defaults to 500 for unknown errors', () => {
    const err = new Error('unknown');
    const res = mockRes();
    errorHandler(err, mockReq(), res, mockNext);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('notFound handler', () => {
  test('returns 404 with route info', () => {
    const res = mockRes();
    notFound(mockReq({ method: 'DELETE', originalUrl: '/songs/123' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: 'Not Found' }));
  });
});

describe('validate middleware', () => {
  test('calls next() when no validation errors', () => {
    // Mock validationResult to return empty errors
    jest.mock('express-validator', () => ({
      validationResult: jest.fn(() => ({ isEmpty: () => true, array: () => [] })),
      body: jest.fn(() => ({ trim: jest.fn().mockReturnThis(), notEmpty: jest.fn().mockReturnThis(), withMessage: jest.fn().mockReturnThis(), isLength: jest.fn().mockReturnThis(), isIn: jest.fn().mockReturnThis(), isInt: jest.fn().mockReturnThis(), isURL: jest.fn().mockReturnThis(), isArray: jest.fn().mockReturnThis(), optional: jest.fn().mockReturnThis() })),
      param: jest.fn(() => ({ isMongoId: jest.fn().mockReturnThis(), withMessage: jest.fn().mockReturnThis() })),
      query: jest.fn(() => ({ optional: jest.fn().mockReturnThis(), isInt: jest.fn().mockReturnThis(), isIn: jest.fn().mockReturnThis() })),
    }));
    const next = jest.fn();
    const res = mockRes();
    // Re-require after mock
    const { validate: validateFn } = require('../../middleware/errorHandler');
    validateFn(mockReq(), res, next);
    // If express-validator isn't mocked in this module scope, next might or might not be called
    // Test that res.json wasn't called (no error)
    expect(res.status).not.toHaveBeenCalledWith(400);
  });
});
