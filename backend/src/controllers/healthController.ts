import { Request, Response } from 'express';
import mongoose from 'mongoose';
import redis from '../config/redis';
import logger from '../config/logger';

export const healthCheck = async (req: Request, res: Response) => {
  const startTime = Date.now();
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: 'unknown',
      redis: 'unknown',
    },
    memory: process.memoryUsage(),
  };

  try {
    // Check MongoDB
    const dbState = mongoose.connection.readyState;
    health.services.database = dbState === 1 ? 'connected' : 'disconnected';

    // Check Redis
    try {
      if (redis) {
        await redis.ping();
        health.services.redis = 'connected';
      } else {
        health.services.redis = 'disconnected';
      }
    } catch (error) {
      health.services.redis = 'disconnected';
      health.status = 'degraded';
    }

    if (dbState !== 1) {
      health.status = 'degraded';
    }
  } catch (error) {
    health.status = 'unhealthy';
    if (logger && logger.error) {
      logger.error('Health check failed:', error);
    }
  }

  const responseTime = Date.now() - startTime;
  (health as any).responseTime = `${responseTime}ms`;

  // Return 200 OK for healthy or degraded so client health ping doesn't crash UI, 500 for unhandled exceptions
  const statusCode = health.status === 'unhealthy' ? 500 : 200;
  
  res.status(statusCode).json(health);
};

export const getHealthStatus = healthCheck;
