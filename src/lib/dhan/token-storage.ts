import fs from 'fs';
import path from 'path';

const TOKEN_FILE_PATH = path.join(process.cwd(), '.dhan-tokens.json');

export interface StoredToken {
    accessToken: string;
    expiryTime: string;
    clientId: string;
    clientName?: string;
    lastRefreshed: string;
}

/**
 * Token Storage Layer
 * Handles persistence of Dhan access tokens to file system
 */
export class TokenStorage {
    /**
     * Save token to storage
     */
    static saveToken(tokenData: StoredToken): void {
        try {
            const data = {
                ...tokenData,
                lastRefreshed: new Date().toISOString(),
            };

            fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
            console.log('✅ Token saved successfully to', TOKEN_FILE_PATH);
        } catch (error) {
            console.error('❌ Error saving token:', error);
            throw new Error('Failed to save token to storage');
        }
    }

    /**
     * Get token from storage
     * Returns null if token doesn't exist or is expired
     */
    static getToken(): StoredToken | null {
        try {
            if (!fs.existsSync(TOKEN_FILE_PATH)) {
                console.log('ℹ️ No token file found at', TOKEN_FILE_PATH);
                return null;
            }

            const fileContent = fs.readFileSync(TOKEN_FILE_PATH, 'utf-8');
            const tokenData: StoredToken = JSON.parse(fileContent);

            // Check if token is expired
            if (this.isTokenExpired(tokenData.expiryTime)) {
                console.log('⚠️ Stored token is expired');
                return null;
            }

            console.log('✅ Valid token retrieved from storage');
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
    static clearToken(): void {
        try {
            if (fs.existsSync(TOKEN_FILE_PATH)) {
                fs.unlinkSync(TOKEN_FILE_PATH);
                console.log('✅ Token cleared successfully');
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
