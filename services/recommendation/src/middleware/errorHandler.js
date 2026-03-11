const logger = require('../config/logger');
const errorHandler = (err, req, res, next) => {
  logger.error('Error', { message: err.message });
  return res.status(err.statusCode || 500).json({ success: false, error: err.name || 'Server Error', message: err.message || 'Something went wrong' });
};
const notFound = (req, res) => res.status(404).json({ success: false, error: 'Not Found' });
module.exports = { errorHandler, notFound };
