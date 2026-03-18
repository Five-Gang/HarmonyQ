const jwksClient = require('jwks-rsa');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

const client = jwksClient({
  jwksUri: process.env.CLERK_JWKS_URL,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000, // 10 minutes
});

const getSigningKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
};

/**
 * Middleware: Verify Clerk JWT token
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'No authentication token provided',
    });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, getSigningKey, { algorithms: ['RS256'] }, (err, decoded) => {
    if (err) {
      logger.warn('JWT verification failed', { error: err.message });
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }

    // Clerk can expose publicMetadata via a JWT template.
    // Try every possible claim path so we are resilient to template variations.
    const roles =
      decoded?.publicMetadata?.roles ||      // Clerk default template key name
      decoded?.public_metadata?.roles ||     // snake_case variant
      decoded?.metadata?.roles ||            // some custom templates use this
      (decoded?.role ? [decoded.role] : []) || // single-role shorthand
      decoded?.roles ||                      // top-level array shorthand
      [];

    logger.debug('JWT decoded claims', {
      sub: decoded.sub,
      publicMetadata: decoded?.publicMetadata,
      public_metadata: decoded?.public_metadata,
      roles,
    });

    req.auth = {
      userId: decoded.sub,
      sessionId: decoded.sid,
      roles,
    };

    next();
  });
};

/**
 * Middleware: Require admin role
 */
const requireAdmin = (req, res, next) => {
  if (!req.auth?.roles?.includes('admin')) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Admin access required',
    });
  }
  next();
};

module.exports = { authenticate, requireAdmin };
