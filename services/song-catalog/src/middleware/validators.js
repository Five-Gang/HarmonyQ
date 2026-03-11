const { body, param, query } = require('express-validator');

const VALID_GENRES = [
  'Pop', 'Rock', 'Hip-Hop', 'R&B', 'Jazz', 'Classical',
  'Electronic', 'Country', 'Latin', 'Reggae', 'Blues',
  'Folk', 'Indie', 'Metal', 'Punk', 'Soul', 'Funk',
  'Alternative', 'K-Pop', 'Other',
];

const createSongValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('artist').trim().notEmpty().withMessage('Artist is required').isLength({ max: 200 }),
  body('album').optional().trim().isLength({ max: 200 }),
  body('genre').isIn(VALID_GENRES).withMessage(`Genre must be one of: ${VALID_GENRES.join(', ')}`),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer (seconds)'),
  body('releaseYear')
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage('Release year must be between 1900 and next year'),
  body('coverArt').optional().isURL().withMessage('Cover art must be a valid URL'),
  body('tags').optional().isArray(),
];

const updateSongValidation = [
  body('title').optional().trim().notEmpty().isLength({ max: 200 }),
  body('artist').optional().trim().notEmpty().isLength({ max: 200 }),
  body('album').optional().trim().isLength({ max: 200 }),
  body('genre').optional().isIn(VALID_GENRES),
  body('duration').optional().isInt({ min: 1 }),
  body('releaseYear').optional().isInt({ min: 1900, max: new Date().getFullYear() + 1 }),
  body('coverArt').optional().isURL().withMessage('Cover art must be a valid URL'),
];

const idParamValidation = [
  param('id').isMongoId().withMessage('Invalid song ID'),
];

const getSongsValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('genre').optional().isIn(VALID_GENRES),
  query('sortBy').optional().isIn(['title', 'artist', 'genre', 'releaseYear', 'playCount', 'createdAt']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
];

module.exports = { createSongValidation, updateSongValidation, idParamValidation, getSongsValidation };
