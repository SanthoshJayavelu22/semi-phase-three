// backend/src/middlewares/rateLimiter.ts
import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

export const createRateLimiter = (options: { windowMs: number; max: number; message: string }) => {
  const store: RateLimitStore = {};

  // Clean up expired keys every minute
  setInterval(() => {
    const now = Date.now();
    for (const key in store) {
      if (store[key].resetTime <= now) {
        delete store[key];
      }
    }
  }, 60 * 1000);

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const key = `${req.baseUrl || ''}_${ip}`;
    const now = Date.now();

    if (!store[key] || store[key].resetTime <= now) {
      store[key] = {
        count: 1,
        resetTime: now + options.windowMs,
      };
      return next();
    }

    store[key].count += 1;

    if (store[key].count > options.max) {
      return res.status(429).json({
        success: false,
        message: options.message,
      });
    }

    next();
  };
};

export const authLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 5 attempts per 5 minutes
  message: 'Too many authentication attempts, please try again after 5 minutes.',
});

export const generalLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 2000, // 200 requests per minute
  message: 'Too many requests, please slow down.',
});
