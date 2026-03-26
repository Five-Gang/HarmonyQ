require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const logger = require('./config/logger');
const recommendationRoutes = require('./routes/recommendationRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3004;

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Recommendation Service API',
      version: '1.0.0',
      description: 'API specifications for the MelodAI Recommendation microservice.',
    },
    servers: [
      { url: 'http://localhost:3004', description: 'Local Server' },
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

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', methods: ['GET'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use(express.json());
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'recommendation', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.use('/recommendations', recommendationRoutes);

// Swagger API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => logger.info(`✨ Recommendation Service running on port ${PORT}`));

process.on('uncaughtException', (err) => { logger.error('Uncaught Exception', { error: err.message }); process.exit(1); });
process.on('unhandledRejection', (reason) => { logger.error('Unhandled Rejection', { reason }); process.exit(1); });

module.exports = app;
