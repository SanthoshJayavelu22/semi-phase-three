// Lazy/Safe Redis client loader to prevent compilation issues when ioredis is not yet installed in local node_modules
let redisClient: any = null;

export const getRedisClient = () => {
  if (!redisClient) {
    try {
      const Redis = require('ioredis');
      redisClient = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        lazyConnect: true,
        retryStrategy: (times: number) => Math.min(times * 50, 2000),
      });

      redisClient.on('connect', () => {
        console.log('Redis client connected');
      });

      redisClient.on('error', (err: any) => {
        console.error('Redis connection error:', err.message);
      });
    } catch (err: any) {
      console.warn('Redis package (ioredis) not loaded local environment:', err.message);
    }
  }
  return redisClient;
};

export default getRedisClient();
