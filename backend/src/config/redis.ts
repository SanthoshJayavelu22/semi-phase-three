// Lazy/Safe Redis client loader with in-memory fallback
let redisClient: any = null;
const memoryStore = new Map<string, { value: string; expiry?: number }>();

const memoryFallbackClient = {
  isFallback: true,
  async get(key: string) {
    const item = memoryStore.get(key);
    if (!item) return null;
    if (item.expiry && item.expiry < Date.now()) {
      memoryStore.delete(key);
      return null;
    }
    return item.value;
  },
  async set(key: string, value: string, mode?: string, duration?: number) {
    let expiry: number | undefined;
    if (mode === 'EX' && typeof duration === 'number') {
      expiry = Date.now() + duration * 1000;
    }
    memoryStore.set(key, { value: String(value), expiry });
    return 'OK';
  },
  async del(key: string) {
    memoryStore.delete(key);
    return 1;
  },
  on() {},
};

export const getRedisClient = () => {
  if (!redisClient) {
    try {
      const Redis = require('ioredis');
      const client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        lazyConnect: true,
        retryStrategy: (times: number) => {
          if (times > 3) {
            console.warn('Redis reconnection retries exhausted. Using in-memory fallback.');
            return null; // Stop reconnecting and fall back
          }
          return Math.min(times * 100, 2000);
        },
      });

      client.on('connect', () => {
        console.log('Redis client connected');
      });

      client.on('error', (err: any) => {
        console.error('Redis connection error:', err.message);
      });

      redisClient = client;
    } catch (err: any) {
      console.warn('Redis package (ioredis) unavailable or failed. Fallback to in-memory cache:', err.message);
      redisClient = memoryFallbackClient;
    }
  }
  return redisClient;
};

export default getRedisClient;

