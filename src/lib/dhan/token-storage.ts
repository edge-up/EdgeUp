import fs from 'fs';
import path from 'path';
import { redis } from '../cache/redis';

const TOKEN_FILE_PATH = path.join(process.cwd(), '.dhan-tokens.json');
const REDIS_TOKEN_KEY = 'dhan:auth:token';

export interface StoredToken {
    accessToken: string;
    expiryTime: string;
    clientId: string;
    clientName?: string;
    lastRefreshed: string;
}

/**
 * Token Storage Layer
 * Handles persistence of Dhan access tokens using Redis (production) or File System (dev fallback)
 */
export class TokenStorage {
    /**
     * Save token to storage
     */
    static async saveToken(tokenData: StoredToken): Promise<void> {
        const data = {
            ...tokenData,
            lastRefreshed: new Date().toISOString(),
        };

        try {
            // Priority 1: Save to Redis (Production)
            if (redis) {
                await redis.set(REDIS_TOKEN_KEY, JSON.stringify(data));
                console.log('✅ Token saved successfully to Redis');
                return;
            }

            // Priority 2: Save to File System (Dev / Fallback)
            fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
            console.log('✅ Token saved successfully to file system');
        } catch (error) {
            console.error('❌ Error saving token:', error);
            throw new Error('Failed to save token to storage');
        }
    }

    /**
     * Get token from storage
     * Returns null if token doesn't exist or is expired
     */
    static async getToken(): Promise<StoredToken | null> {
        try {
            let tokenData: StoredToken | null = null;

            // Priority 1: Try Redis
            if (redis) {
                const redisData = await redis.get<string | StoredToken>(REDIS_TOKEN_KEY);
                if (redisData) {
                    tokenData = typeof redisData === 'string' ? JSON.parse(redisData) : redisData;
                    console.log('✅ Token retrieved from Redis');
                }
            }

            // Priority 2: Try File System (if no Redis or Redis failed/empty)
            if (!tokenData && fs.existsSync(TOKEN_FILE_PATH)) {
                const fileContent = fs.readFileSync(TOKEN_FILE_PATH, 'utf-8');
                tokenData = JSON.parse(fileContent);
                console.log('✅ Token retrieved from file system');
            }

            if (!tokenData) {
                console.log('ℹ️ No token found in storage');
                return null;
            }

            // Check if token is expired
            if (this.isTokenExpired(tokenData.expiryTime)) {
                console.log('⚠️ Stored token is expired');
                return null;
            }

            return tokenData;
        } catch (error) {
            console.error('❌ Error reading token:', error);
            return null;
        }
    }

    /**
     * Check if token is expired or about to expire (within 1 hour)
     */
    static isTokenExpired(expiryTime: string): boolean {
        const expiryDate = new Date(expiryTime);
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

        // Consider expired if expires within 1 hour
        return expiryDate <= oneHourFromNow;
    }

    /**
     * Clear stored token
     */
    static async clearToken(): Promise<void> {
        try {
            if (redis) {
                await redis.del(REDIS_TOKEN_KEY);
                console.log('✅ Token cleared from Redis');
            }

            if (fs.existsSync(TOKEN_FILE_PATH)) {
                fs.unlinkSync(TOKEN_FILE_PATH);
                console.log('✅ Token cleared from file system');
            }
        } catch (error) {
            console.error('❌ Error clearing token:', error);
            throw new Error('Failed to clear token from storage');
        }
    }

    /**
     * Get time until token expiry in hours
     */
    static getTimeUntilExpiry(expiryTime: string): number {
        const expiryDate = new Date(expiryTime);
        const now = new Date();
        const diffMs = expiryDate.getTime() - now.getTime();
        return Math.floor(diffMs / (1000 * 60 * 60)); // Convert to hours
    }

    /**
     * Check if token needs refresh (expires within 24 hours)
     */
    static needsRefresh(expiryTime: string): boolean {
        const hoursUntilExpiry = this.getTimeUntilExpiry(expiryTime);
        return hoursUntilExpiry <= 24;
    }
}
