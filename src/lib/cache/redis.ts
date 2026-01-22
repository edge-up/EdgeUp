import { Redis } from '@upstash/redis';
import { memCache } from './memory';

// Check if Redis is properly configured
const isRedisConfigured = !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
);

// Create Redis client only if configured
const redis = isRedisConfigured
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
    : null;

if (!isRedisConfigured) {
    console.warn('⚠️ Upstash Redis not configured. Using memory cache only.');
}

export { redis };

// Cache keys
export const CACHE_KEYS = {
    LIVE_SECTORS: 'live:sectors',
    LIVE_STOCKS: (sectorId: string) => `live:stocks:${sectorId}`,
    LATEST_SNAPSHOT: 'snapshot:latest',
    SECTOR_SNAPSHOT: (snapshotId: string) => `snapshot:${snapshotId}:sectors`,
    STOCK_SNAPSHOT: (snapshotId: string, sectorId: string) => `snapshot:${snapshotId}:stocks:${sectorId}`,
    MARKET_STATUS: 'market:status',
    FO_LIST: 'master:fo_list',
    SECTOR_CONSTITUENTS: 'master:sector_constituents',
    QUOTES: (ids: string) => `quotes:${ids}`,
    STOCK_INTRADAY: 'intraday:stock',
};

// Cache TTLs (in seconds)
export const CACHE_TTL = {
    LIVE_DATA: 60, // 1 minute for live calculations
    SNAPSHOT: 86400, // 24 hours for frozen snapshots
    MASTER_DATA: 3600, // 1 hour for F&O list and constituents
    MARKET_STATUS: 300, // 5 minutes for market status
    QUOTES: 30, // 30 seconds for quote data
};

/**
 * Two-layer cache: Memory (fast) -> Redis (persistent)
 * Memory cache acts as L1, Redis as L2
 */
export const cache = {
    /**
     * Get from cache (memory first, then Redis)
     */
    async get<T>(key: string): Promise<T | null> {
        // L1: Check memory cache first (sub-ms)
        const memoryHit = memCache.get<T>(key);
        if (memoryHit !== null) {
            return memoryHit;
        }

        // L2: Check Redis
        if (!redis) return null;

        try {
            const data = await redis.get(key);
            if (data) {
                // Backfill memory cache for next request
                memCache.set(key, data, 30); // Short TTL for L1
                return data as T;
            }
            return null;
        } catch (error) {
            console.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    },

    /**
     * Set in both caches
     */
    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        // Always set in memory cache (fast path for next request)
        memCache.set(key, value, Math.min(ttlSeconds || 60, 300)); // Max 5 min in memory

        // Set in Redis for persistence
        if (!redis) return;

        try {
            if (ttlSeconds) {
                await redis.setex(key, ttlSeconds, JSON.stringify(value));
            } else {
                await redis.set(key, JSON.stringify(value));
            }
        } catch (error) {
            console.error(`Cache set error for key ${key}:`, error);
        }
    },

    /**
     * Delete from both caches
     */
    async del(key: string): Promise<void> {
        memCache.del(key);

        if (!redis) return;
        try {
            await redis.del(key);
        } catch (error) {
            console.error(`Cache delete error for key ${key}:`, error);
        }
    },

    /**
     * Delete by pattern
     */
    async delPattern(pattern: string): Promise<void> {
        // Clear memory cache by prefix
        memCache.delByPrefix(pattern.replace('*', ''));

        if (!redis) return;
        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        } catch (error) {
            console.error(`Cache delete pattern error for ${pattern}:`, error);
        }
    },

    /**
     * Check if key exists
     */
    async exists(key: string): Promise<boolean> {
        // Check memory first
        if (memCache.get(key) !== null) return true;

        if (!redis) return false;
        try {
            const result = await redis.exists(key);
            return result === 1;
        } catch (error) {
            console.error(`Cache exists error for key ${key}:`, error);
            return false;
        }
    },

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            memory: memCache.getStats(),
            redis: isRedisConfigured ? 'connected' : 'disabled',
        };
    },
};

export default redis;
