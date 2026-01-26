import { NextResponse } from 'next/server';
import { getDhanClient } from '@/lib/dhan/dhan-client';
import { TokenStorage } from '@/lib/dhan/token-storage';
import { redis } from '@/lib/cache/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
    const diagnostics: any = {
        env: {
            DHAN_CLIENT_ID_CONFIGURED: !!process.env.DHAN_CLIENT_ID,
            DHAN_CLIENT_ID_VAL: process.env.DHAN_CLIENT_ID, // Safe to show Client ID? Yes, usually public-ish, but let's be careful.
            REDIS_URL_CONFIGURED: !!process.env.UPSTASH_REDIS_REST_URL,
            REDIS_TOKEN_CONFIGURED: !!process.env.UPSTASH_REDIS_REST_TOKEN,
        },
        redis: {
            connected: false,
            error: null
        },
        token: {
            exists: false,
            source: 'unknown',
            expiry: null,
            preview: null
        },
        api: {
            success: false,
            error: null,
            data: null
        }
    };

    try {
        // 1. Check Redis Connection
        try {
            if (redis) {
                await redis.ping();
                diagnostics.redis.connected = true;
            } else {
                diagnostics.redis.error = 'Redis client not initialized (missing env?)';
            }
        } catch (e) {
            diagnostics.redis.error = e instanceof Error ? e.message : String(e);
        }

        // 3. Check Token
        let tokenClientId = null;
        try {
            const storedToken = await TokenStorage.getToken();
            if (storedToken) {
                diagnostics.token.exists = true;
                diagnostics.token.expiry = storedToken.expiryTime;
                diagnostics.token.clientName = storedToken.clientName;
                diagnostics.token.clientId = storedToken.clientId; // Show the stored Client ID
                tokenClientId = storedToken.clientId;
                diagnostics.token.preview = storedToken.accessToken.substring(0, 10) + '...';
            } else {
                diagnostics.token.error = 'No token found via TokenStorage.getToken()';
            }
        } catch (e) {
            diagnostics.token.error = e instanceof Error ? e.message : String(e);
        }

        // 4. Test API Call
        try {
            const client = getDhanClient();
            // Try explicit HDFC Bank (NSE_EQ_1333) instead of Index
            const securityId = 'NSE_EQ_1333';

            // Capture what the client is using
            const headers = await (client as any).getHeaders();
            diagnostics.api.headersUsed = {
                'client-id': headers['client-id'],
                'access-token-length': headers['access-token']?.length
            };

            const result = await client.getLTP([securityId]);
            diagnostics.api.success = true;
            diagnostics.api.data = result;
        } catch (e) {
            diagnostics.api.error = e instanceof Error ? e.message : String(e);
        }

        return NextResponse.json({
            success: diagnostics.api.success,
            diagnostics
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            fatalError: error instanceof Error ? error.message : String(error),
            diagnostics
        }, { status: 500 });
    }
}
