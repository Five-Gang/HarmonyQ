require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const connectDB = require('./config/database');
const logger = require('./config/logger');
const playlistRoutes = require('./routes/playlistRoutes');
const userPlaylistRoutes = require('./routes/userPlaylistRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3003;

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Playlist Service API',
      version: '1.0.0',
      description: 'API specifications for the MelodAI Playlist microservice.',
    },
    servers: [
      { url: 'http://localhost:3003', description: 'Local Server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter the valid Clerk JWT token',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);

// Security middleware
// Disable CSP and HSTS on /api-docs so Swagger UI assets load correctly over plain HTTP
app.use('/api-docs', helmet({ contentSecurityPolicy: false, crossOriginOpenerPolicy: false, hsts: false }));
app.use(/^(?!\/api-docs)/, helmet());

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', methods: ['GET', 'POST', 'PUT', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// Sanitize user input — strips keys containing '$' or '.' to prevent NoSQL injection
app.use(mongoSanitize());
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'playlist', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.use('/playlists', playlistRoutes);
app.use('/users', userPlaylistRoutes);
// Also mount at /playlists/users so the Vite proxy path (/api/playlists/users/*) resolves correctly
app.use('/playlists/users', userPlaylistRoutes);

// Swagger API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => logger.info(`🎶 Playlist Service running on port ${PORT}`));
};

process.on('uncaughtException', (err) => { logger.error('Uncaught Exception', { error: err.message }); process.exit(1); });
process.on('unhandledRejection', (reason) => { logger.error('Unhandled Rejection', { reason }); process.exit(1); });

startServer();
module.exports = app;
