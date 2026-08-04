// backend/src/config/apm.ts
import mongoose from 'mongoose';
import logger from './logger';

export const initMonitoring = () => {
  // Monitor Mongoose DB Connection Pool & Performance
  mongoose.connection.on('connected', () => {
    logger.info('APM: Mongoose connected to MongoDB cluster.');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('APM Alert: MongoDB connection pool error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('APM Alert: MongoDB connection pool disconnected.');
  });

  // Track uncaught exceptions and unhandled promise rejections
  process.on('uncaughtException', (error) => {
    logger.error('APM Critical Error: Uncaught Exception:', error);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('APM Critical Error: Unhandled Rejection at Promise:', { promise, reason });
  });
};
