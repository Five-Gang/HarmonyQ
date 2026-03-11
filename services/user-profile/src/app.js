require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const connectDB = require('./config/database');
const logger = require('./config/logger');
const userProfileRoutes = require('./routes/userProfileRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3002;

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User Profile Service API',
      version: '1.0.0',
      description: 'API specifications for the MelodAI User Profile microservice.',
    },
    servers: [
      { url: 'http://localhost:3002', description: 'Local Server' },
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

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', methods: ['GET', 'POST', 'PUT', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'user-profile', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.use('/users', userProfileRoutes);

// Swagger API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`👤 User Profile Service running on port ${PORT}`);
  });
};

process.on('uncaughtException', (err) => { logger.error('Uncaught Exception', { error: err.message }); process.exit(1); });
process.on('unhandledRejection', (reason) => { logger.error('Unhandled Rejection', { reason }); process.exit(1); });

startServer();
module.exports = app;
