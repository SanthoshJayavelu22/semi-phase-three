import getRedisClient from '../config/redis';
import { getIO, emitEvent } from '../config/socket';

export class CacheService {
  private redis: any;
  private inMemoryTimestamps: Map<string, number> = new Map();
  private debounceTimers: Record<string, NodeJS.Timeout> = {};

  constructor() {
    this.redis = getRedisClient();
  }

  /**
   * Mark that a specific entity type has changed
   * Used by controllers after any mutation (create, update, delete)
   */
  async markChange(entityType: string, id?: string): Promise<void> {
    const key = `change:${entityType}`;
    const timestamp = Date.now();

    try {
      if (this.redis && typeof this.redis.set === 'function') {
        await this.redis.set(key, timestamp.toString());
        if (id) {
          await this.redis.set(`change:${entityType}:${id}`, timestamp.toString());
        }
      }
    } catch (err: any) {
      // Fallback to in-memory map if Redis set fails
      this.inMemoryTimestamps.set(key, timestamp);
      if (id) {
        this.inMemoryTimestamps.set(`change:${entityType}:${id}`, timestamp);
      }
    }

    // Always update in-memory map as instant cache
    this.inMemoryTimestamps.set(key, timestamp);
    if (id) {
      this.inMemoryTimestamps.set(`change:${entityType}:${id}`, timestamp);
    }

    // Broadcast change notification via Socket.io
    emitEvent('DATA_CHANGED', {
      entityType,
      id,
      timestamp,
    });
  }

  /**
   * Get the last change timestamp for a given entity type
   */
  async getLastChange(entityType: string): Promise<number> {
    const key = `change:${entityType}`;
    try {
      if (this.redis && typeof this.redis.get === 'function') {
        const val = await this.redis.get(key);
        if (val) return parseInt(val, 10);
      }
    } catch (err: any) {
      // Fallback to memory
    }
    return this.inMemoryTimestamps.get(key) || 0;
  }

  /**
   * Check if data has changed since a given timestamp
   */
  async hasChangedSince(entityType: string, since: number): Promise<boolean> {
    const lastChange = await this.getLastChange(entityType);
    return lastChange > since;
  }

  /**
   * Get all entity timestamps for a client to check which panels need refresh
   */
  async getAllTimestamps(): Promise<Record<string, number>> {
    const types = ['institutes', 'students', 'exams', 'results', 'revaluation', 'remittances', 'marks', 'courses', 'batches'];
    const result: Record<string, number> = {};

    for (const type of types) {
      result[type] = await this.getLastChange(type);
    }

    return result;
  }

  /**
   * Debounced change marking - coalesce multiple changes in a short time
   */
  async markChangeDebounced(entityType: string, id?: string, delay: number = 500): Promise<void> {
    const timerKey = `${entityType}:${id || 'all'}`;

    if (this.debounceTimers[timerKey]) {
      clearTimeout(this.debounceTimers[timerKey]);
    }

    this.debounceTimers[timerKey] = setTimeout(() => {
      this.markChange(entityType, id);
      delete this.debounceTimers[timerKey];
    }, delay);
  }
}

export const cacheService = new CacheService();
export default cacheService;
