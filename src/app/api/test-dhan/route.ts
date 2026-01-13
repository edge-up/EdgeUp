import { NextRequest, NextResponse } from 'next/server';
import { getDhanClient } from '@/lib/dhan/dhan-client';

export const dynamic = 'force-dynamic';

/**
 * Test endpoint to verify Dhan API connectivity
 * GET /api/test-dhan
 */
export async function GET(request: NextRequest) {
    const dhanClient = getDhanClient();

    // Debug: Check what env vars are set
    const clientId = process.env.DHAN_CLIENT_ID;
    const accessToken = process.env.DHAN_ACCESS_TOKEN;

    console.log('🔍 Debug - DHAN_CLIENT_ID:', clientId ? `${clientId.substring(0, 4)}...` : 'NOT SET');
    console.log('🔍 Debug - DHAN_ACCESS_TOKEN:', accessToken ? `${accessToken.substring(0, 10)}...` : 'NOT SET');

    // Check if credentials are configured
    const hasCredentials = !!(clientId && accessToken);

    if (!hasCredentials) {
        return NextResponse.json({
            success: false,
            error: 'Dhan API credentials not configured',
            help: 'Add DHAN_CLIENT_ID and DHAN_ACCESS_TOKEN to your .env file',
            debug: {
                clientIdSet: !!clientId,
                accessTokenSet: !!accessToken,
            }
        }, { status: 400 });
    }

    try {
        // Test 1: fundlimit endpoint
        const fundResponse = await fetch('https://api.dhan.co/v2/fundlimit', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'access-token': accessToken,
            },
        });

        if (!fundResponse.ok) {
            const errorText = await fundResponse.text();
            console.log('🔴 Fund limit error:', fundResponse.status, errorText);
            throw new Error(`Dhan API Error: ${fundResponse.statusText} - ${errorText}`);
        }

        const fundData = await fundResponse.json();

        // Test 2: Quote API for RELIANCE (Security ID: 2885)
        const quotePayload = {
            NSE_EQ: [2885],  // Reliance Industries
        };

        const quoteResponse = await fetch('https://api.dhan.co/v2/marketfeed/quote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access-token': accessToken,
                'client-id': clientId,
            },
            body: JSON.stringify(quotePayload),
        });

        let quoteData = null;
        let quoteError = null;

        if (quoteResponse.ok) {
            quoteData = await quoteResponse.json();
            console.log('🟢 Quote response:', JSON.stringify(quoteData, null, 2));
        } else {
            quoteError = await quoteResponse.text();
            console.log('🔴 Quote error:', quoteResponse.status, quoteError);
        }

        return NextResponse.json({
            success: true,
            message: '✅ Dhan API is working!',
            fundLimit: {
                clientId: fundData.dhanClientId,
                availableBalance: fundData.availabelBalance,
            },
            quoteTest: quoteData ? {
                success: true,
                data: quoteData,
            } : {
                success: false,
                error: quoteError,
                status: quoteResponse.status,
            },
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.log('🔴 Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'API call failed',
            help: 'Check if your access token is valid and not expired',
        }, { status: 500 });
    }
}
