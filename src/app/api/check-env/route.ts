import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Simple endpoint to check if Dhan API credentials are properly configured
 */
export async function GET() {
    const clientId = process.env.DHAN_CLIENT_ID;
    const accessToken = process.env.DHAN_ACCESS_TOKEN;

    return NextResponse.json({
        hasClientId: !!clientId,
        hasAccessToken: !!accessToken,
        clientIdLength: clientId?.length || 0,
        accessTokenLength: accessToken?.length || 0,
        accessTokenPrefix: accessToken?.substring(0, 20) + '...' || 'MISSING',
    });
}
