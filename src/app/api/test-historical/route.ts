import { NextRequest, NextResponse } from 'next/server';
import { getDhanClient } from '@/lib/dhan/dhan-client';

export const dynamic = 'force-dynamic';

/**
 * Test endpoint to debug historical data fetching
 * Usage: /api/test-historical?symbol=INFY
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'INFY';

    try {
        const dhanClient = getDhanClient();

        // Test with a known stock - INFY
        const testSecurityId = 'NSE_EQ_INE009A01021'; // INFY ISIN

        console.log(`🧪 Testing historical data for ${symbol} (${testSecurityId})...`);

        // Test 1: Get historical data for last 14 days
        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 14);

        const historicalData = await dhanClient.getHistoricalData(
            testSecurityId,
            fromDate,
            toDate,
            'NSE_EQ'
        );

        console.log(`📊 Historical data received: ${historicalData?.length || 0} days`);

        // Test 2: Get previous day OHLC specifically
        const prevDayOHLC = await dhanClient.getPreviousDayOHLC(testSecurityId, 'NSE_EQ');

        return NextResponse.json({
            success: true,
            symbol,
            testSecurityId,
            dateRange: {
                from: fromDate.toISOString().split('T')[0],
                to: toDate.toISOString().split('T')[0],
            },
            historicalDataCount: historicalData?.length || 0,
            historicalData: historicalData?.map(d => ({
                date: d.timestamp,
                open: d.open,
                high: d.high,
                low: d.low,
                close: d.close,
            })) || [],
            previousDayOHLC: prevDayOHLC ? {
                timestamp: prevDayOHLC.timestamp,
                open: prevDayOHLC.open,
                high: prevDayOHLC.high,
                low: prevDayOHLC.low,
                close: prevDayOHLC.close,
            } : null,
        });
    } catch (error: any) {
        console.error('❌ Test historical API error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack,
        }, { status: 500 });
    }
}
