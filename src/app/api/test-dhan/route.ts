import { NextRequest, NextResponse } from 'next/server';
import { getDhanClient } from '@/lib/dhan/dhan-client';

export const dynamic = 'force-dynamic';

/**
 * Test endpoint to verify Dhan API connectivity and functionality
 * GET /api/test-dhan
 */
export async function GET(request: NextRequest) {
    const dhanClient = getDhanClient();

    // Debug: Check environment variables
    const clientId = process.env.DHAN_CLIENT_ID;
    const accessToken = process.env.DHAN_ACCESS_TOKEN;

    if (!clientId || !accessToken) {
        return NextResponse.json({
            success: false,
            error: 'Dhan API credentials not configured',
            help: 'Add DHAN_CLIENT_ID and DHAN_ACCESS_TOKEN to your .env file',
        }, { status: 400 });
    }

    try {
        const results: any = {
            success: true,
            timestamp: new Date().toISOString(),
            tests: {}
        };

        // 1. Test Fund Limit (Basic Connectivity)
        try {
            const fundResponse = await fetch('https://api.dhan.co/v2/fundlimit', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'access-token': accessToken,
                    'client-id': clientId,
                },
            });
            if (fundResponse.ok) {
                const data = await fundResponse.json();
                results.tests.fundLimit = { success: true, balance: data.availabelBalance };
            } else {
                results.tests.fundLimit = { success: false, status: fundResponse.status };
            }
        } catch (e) {
            results.tests.fundLimit = { success: false, error: String(e) };
        }

        // 2. Test Equity Quotes (Reliance - ID 2885)
        try {
            const quotes = await dhanClient.getQuotes(['NSE_EQ_2885']);
            results.tests.equityQuote = {
                success: quotes.length > 0,
                symbol: 'RELIANCE',
                price: quotes[0]?.ltp
            };
        } catch (e) {
            results.tests.equityQuote = { success: false, error: String(e) };
        }

        // 3. Test Futures Quotes (Reliance Jan 2026 Fut - ID 49993)
        // This verifies the important integer-ID fix in DhanClient
        try {
            const futQuotes = await dhanClient.getQuotes(['NSE_FNO_49993']);
            results.tests.futuresQuote = {
                success: futQuotes.length > 0,
                symbol: 'RELIANCE-FUT',
                oi: futQuotes[0]?.openInterest
            };
        } catch (e) {
            results.tests.futuresQuote = { success: false, error: String(e) };
        }

        return NextResponse.json(results);

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown technical error',
        }, { status: 500 });
    }
}
