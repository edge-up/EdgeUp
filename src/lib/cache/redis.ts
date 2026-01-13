import { Redis } from '@upstash/redis';

// Create Redis client from environment variables
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

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
};

// Cache TTLs (in seconds)
export const CACHE_TTL = {
    LIVE_DATA: 60, // 1 minute for live calculations
    SNAPSHOT: 86400, // 24 hours for frozen snapshots
    MASTER_DATA: 3600, // 1 hour for F&O list and constituents
    MARKET_STATUS: 300, // 5 minutes for market status
};

/**
 * Cache wrapper with automatic JSON serialization
 */
export const cache = {
    async get<T>(key: string): Promise<T | null> {
        try {
            const data = await redis.get(key);
            return data as T | null;
        } catch (error) {
            console.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    },

    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
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

    async del(key: string): Promise<void> {
        try {
            await redis.del(key);
        } catch (error) {
            console.error(`Cache delete error for key ${key}:`, error);
        }
    },

    async delPattern(pattern: string): Promise<void> {
        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        } catch (error) {
            console.error(`Cache delete pattern error for ${pattern}:`, error);
        }
    },

    async exists(key: string): Promise<boolean> {
        try {
            const result = await redis.exists(key);
            return result === 1;
        } catch (error) {
            console.error(`Cache exists error for key ${key}:`, error);
            return false;
        }
    },
};

export default redis;
