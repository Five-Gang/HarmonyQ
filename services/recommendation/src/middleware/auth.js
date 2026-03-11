const jwksClient = require('jwks-rsa');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

const client = jwksClient({ jwksUri: process.env.CLERK_JWKS_URL, cache: true, cacheMaxAge: 600000 });
const getSigningKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => { if (err) return callback(err); callback(null, key.getPublicKey()); });
};

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ success: false, error: 'Unauthorized' });
  jwt.verify(authHeader.split(' ')[1], getSigningKey, { algorithms: ['RS256'] }, (err, decoded) => {
    if (err) { logger.warn('JWT failed', { error: err.message }); return res.status(401).json({ success: false, error: 'Unauthorized' }); }
    req.auth = { userId: decoded.sub, roles: decoded['public_metadata']?.roles || [] };
    next();
  });
};

module.exports = { authenticate };
