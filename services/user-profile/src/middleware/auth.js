// Shared auth middleware - same implementation reused across services
const jwksClient = require('jwks-rsa');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

const client = jwksClient({
  jwksUri: process.env.CLERK_JWKS_URL,
  cache: true,
  cacheMaxEntries: 10,
  cacheMaxAge: 3600000, // 1 hour cache
  rateLimit: true,
});

const getSigningKey = (header, callback) => {
  try {
    client.getSigningKey(header.kid, (err, key) => {
      if (err) {
        logger.error('Failed to get signing key', { error: err.message, kid: header.kid });
        return callback(err);
      }
      callback(null, key.getPublicKey());
    });
  } catch (error) {
    logger.error('Error in getSigningKey', { error: error.message });
    callback(error);
  }
};

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized', message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    jwt.verify(token, getSigningKey, { algorithms: ['RS256'] }, (err, decoded) => {
      if (err) {
        logger.warn('JWT verification failed', { error: err.message });
        return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Invalid token' });
      }
      req.auth = {
        userId: decoded.sub,
        sessionId: decoded.sid,
        roles: decoded['public_metadata']?.roles || [],
      };
      next();
    });
  } catch (error) {
    logger.error('Unexpected error in authenticate middleware', { error: error.message });
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.auth?.roles?.includes('admin')) {
    return res.status(403).json({ success: false, error: 'Forbidden', message: 'Admin access required' });
  }
  next();
};

module.exports = { authenticate, requireAdmin };
