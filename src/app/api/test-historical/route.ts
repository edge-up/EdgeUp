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

        // Get real stock data from database
        const prisma = (await import('@/lib/db/prisma')).default;
        const stock = await prisma.stock.findUnique({
            where: { symbol },
            select: { dhanSecurityId: true, symbol: true, name: true }
        });

        if (!stock || !stock.dhanSecurityId) {
            return NextResponse.json({
                success: false,
                error: `Stock ${symbol} not found or has no dhanSecurityId`,
            }, { status: 404 });
        }

        console.log(`🧪 Testing historical data for ${stock.symbol} (${stock.dhanSecurityId})...`);

        // Test 1: Get historical data for last 14 days
        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 14);

        const historicalData = await dhanClient.getHistoricalData(
            stock.dhanSecurityId,
            fromDate,
            toDate,
            'NSE_EQ'
        );

        console.log(`📊 Historical data received: ${historicalData?.length || 0} days`);

        // Test 2: Get previous day OHLC specifically
        const prevDayOHLC = await dhanClient.getPreviousDayOHLC(stock.dhanSecurityId, 'NSE_EQ');

        return NextResponse.json({
            success: true,
            symbol: stock.symbol,
            stockName: stock.name,
            dhanSecurityId: stock.dhanSecurityId,
            dateRange: {
                from: fromDate.toISOString().split('T')[0],
                to: toDate.toISOString().split('T')[0],
            },
            historicalDataCount: historicalData?.length || 0,
            historicalData: historicalData?.slice(0, 5).map(d => ({
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
