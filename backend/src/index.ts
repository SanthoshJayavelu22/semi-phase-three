import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { randomUUID as uuidv4 } from 'crypto';
import path from 'path';
import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { seedSuperAdmin } from './config/seed';
import { Batch } from './models/batchModel';
import getRedisClient from './config/redis';
import logger from './config/logger';

import v1Routes from './routes/v1';
import { notFound, errorHandler } from './middlewares/errorMiddleware';
import { authLimiter, generalLimiter } from './middlewares/rateLimiter';

import { validateEnv } from './config/envValidation';
import { initMonitoring } from './config/apm';
import { sanitizeLogData } from './utils/sanitizeLogs';

// Optional package dynamic loaders for graceful fallback when not installed locally
let compression: any;
try { compression = require('compression'); } catch (e) {}

let helmet: any;
try { helmet = require('helmet'); } catch (e) {}

let responseTime: any;
try { responseTime = require('response-time'); } catch (e) {}

let Sentry: any;
try { Sentry = require('@sentry/node'); } catch (e) {}

dotenv.config();
validateEnv();
initMonitoring();

const app = express();

// Sentry initialization
if (process.env.SENTRY_DSN && Sentry) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
  });

  if (Sentry.Handlers?.requestHandler) {
    app.use(Sentry.Handlers.requestHandler());
  }
}

// Connect to database and seed Super Admin
const initApp = async () => {
  await connectDB();
  await seedSuperAdmin();
  await Batch.syncIndexes().catch((err: any) => console.log('Batch index sync:', err.message));
};
initApp();

const PORT = process.env.PORT || 5003;

// Security headers (Helmet)
if (helmet) {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));
}

// Compress responses
if (compression) {
  app.use(compression({
    level: 6,
    threshold: 1024, // Only compress responses > 1KB
    filter: (req: express.Request, res: express.Response) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));
}

// Response time tracking
if (responseTime) {
  app.use(responseTime((req: Request, res: Response, time: number) => {
    logger.info(JSON.stringify({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      responseTime: `${time}ms`,
      ip: req.ip
    }));
  }));
}

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), { dotfiles: 'ignore', index: false }));
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads'), { dotfiles: 'ignore', index: false }));

app.use((req: any, res: any, next: any) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[PERF] ${req.method} ${req.originalUrl || req.url} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Add request ID and detailed request/response logger middleware
app.use((req: any, res: any, next) => {
  req.requestId = uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  
  const startTime = Date.now();
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n--- 📥 [${req.requestId}] Incoming Request: ${req.method} ${req.originalUrl}`);
    if (req.body && Object.keys(req.body).length > 0) {
      const loggedBody = sanitizeLogData(req.body);
      console.log(`[${req.requestId}] Request Body:`, JSON.stringify(loggedBody, null, 2));
    }
  }

  // Intercept res.json to log the response in dev environment
  const originalJson = res.json;
  res.json = function (body: any) {
    const duration = Date.now() - startTime;
    if (process.env.NODE_ENV === 'development') {
      console.log(`--- 📤 [${req.requestId}] Response JSON Sent: ${res.statusCode} (took ${duration}ms)`);
    } else {
      console.log(`[${req.method} ${req.originalUrl}] -> ${res.statusCode} (${duration}ms)`);
    }
    return originalJson.apply(this, arguments);
  };

  next();
});

// Apply Rate Limiters (exclude health check endpoint from rate limiting)
app.use('/api/health', (req, res, next) => next());
app.use('/api/auth', authLimiter);
app.use('/api/users/login', authLimiter);
app.use('/api', generalLimiter);

import { swaggerDocument } from './docs/swaggerSpec';

// API Documentation Endpoint
app.get('/api/docs', (req, res) => {
  res.json(swaggerDocument);
});

// API Routes with Versioning strategy
app.use('/api/v1', v1Routes);
app.use('/api', v1Routes); // Default to v1

// Basic Route
app.get('/', (req: Request, res: Response) => {
  res.send('Backend server is running with MVC Architecture!');
});

// Sentry error handler must be before any other error middleware
if (process.env.SENTRY_DSN && Sentry?.Handlers?.errorHandler) {
  app.use(Sentry.Handlers.errorHandler());
}

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  
  const timeout = setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);

  try {
    // Close database connections
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    
    // Close Redis connection
    const redis = getRedisClient();
    if (redis) {
      await redis.quit();
      logger.info('Redis connection closed');
    }
    
    // Close server
    server.close(() => {
      logger.info('HTTP server closed');
      clearTimeout(timeout);
      process.exit(0);
    });
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Listen for shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  gracefulShutdown('unhandledRejection');
});
