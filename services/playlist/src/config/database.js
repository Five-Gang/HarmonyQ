const mongoose = require('mongoose');
const logger = require('./logger');
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    logger.info(`MongoDB connected: ${conn.connection.host} | DB: ${conn.connection.name}`);
  } catch (error) {
    logger.error('MongoDB connection failed', { error: error.message });
    process.exit(1);
  }
};
module.exports = connectDB;
