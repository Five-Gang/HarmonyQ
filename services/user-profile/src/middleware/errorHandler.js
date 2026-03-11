const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', { message: err.message, path: req.path, method: req.method });

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, error: 'Validation Error', messages: errors });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ success: false, error: 'Conflict', message: `Duplicate ${field}` });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, error: 'Bad Request', message: 'Invalid ID format' });
  }

  return res.status(err.statusCode || 500).json({
    success: false,
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong',
  });
};

const notFound = (req, res) => {
  res.status(404).json({ success: false, error: 'Not Found', message: `Route ${req.method} ${req.originalUrl} not found` });
};

module.exports = { errorHandler, notFound };
