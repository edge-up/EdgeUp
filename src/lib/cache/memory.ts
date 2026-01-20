import { LRUCache } from 'lru-cache';

/**
 * In-Memory LRU Cache
 * Ultra-fast fallback when Redis is slow/unavailable
 * Also reduces Redis API calls for frequently accessed data
 */

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

// Create LRU cache with max 500 items
const memoryCache = new LRUCache<string, CacheEntry<unknown>>({
    max: 500,
    // 5 minute default TTL (cleanup stale entries)
    ttl: 5 * 60 * 1000,
});

// Cache stats for monitoring
let stats = {
    hits: 0,
    misses: 0,
    sets: 0,
};

/**
 * Memory cache wrapper with TTL support
 */
export const memCache = {
    /**
     * Get item from memory cache
     */
    get<T>(key: string): T | null {
        const entry = memoryCache.get(key) as CacheEntry<T> | undefined;

        if (!entry) {
            stats.misses++;
            return null;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            memoryCache.delete(key);
            stats.misses++;
            return null;
        }

        stats.hits++;
        return entry.data;
    },

    /**
     * Set item in memory cache with TTL
     */
    set<T>(key: string, value: T, ttlSeconds: number = 60): void {
        const entry: CacheEntry<T> = {
            data: value,
            expiresAt: Date.now() + (ttlSeconds * 1000),
        };
        memoryCache.set(key, entry);
        stats.sets++;
    },

    /**
     * Delete item from memory cache
     */
    del(key: string): void {
        memoryCache.delete(key);
    },

    /**
     * Clear all items matching a pattern (prefix)
     */
    delByPrefix(prefix: string): void {
        const keys = Array.from(memoryCache.keys());
        for (const key of keys) {
            if (key.startsWith(prefix)) {
                memoryCache.delete(key);
            }
        }
    },

    /**
     * Clear entire cache
     */
    clear(): void {
        memoryCache.clear();
        stats = { hits: 0, misses: 0, sets: 0 };
    },

    /**
     * Get cache statistics
     */
    getStats() {
        const hitRate = stats.hits + stats.misses > 0
            ? (stats.hits / (stats.hits + stats.misses) * 100).toFixed(1)
            : '0';
        return {
            ...stats,
            hitRate: `${hitRate}%`,
            size: memoryCache.size,
            maxSize: 500,
        };
    },
};

export default memCache;
