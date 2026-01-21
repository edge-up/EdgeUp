import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDhanClient } from '@/lib/dhan/dhan-client';
import { cache, CACHE_KEYS } from '@/lib/cache/redis';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stocks/[symbol]/intraday
 * Returns intraday OHLC data for different intervals
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { symbol: string } }
) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const symbol = params.symbol.toUpperCase();
        const searchParams = request.nextUrl.searchParams;
        const interval = searchParams.get('interval') || '5'; // 1, 5, 15, 60 (minutes)
        const from = searchParams.get('from'); // ISO date string
        const to = searchParams.get('to'); // ISO date string

        // Validate interval
        const validIntervals = ['1', '5', '15', '60'];
        if (!validIntervals.includes(interval)) {
            return NextResponse.json(
                { error: 'Invalid interval. Must be 1, 5, 15, or 60' },
                { status: 400 }
            );
        }

        // Check cache
        const cacheKey = `${CACHE_KEYS.STOCK_INTRADAY}:${symbol}:${interval}`;
        const cached = await cache.get(cacheKey);
        if (cached) {
            return NextResponse.json({
                success: true,
                data: cached,
                cached: true,
            });
        }

        // Get stock from database
        const prisma = (await import('@/lib/db/prisma')).default;
        const stock = await prisma.stock.findUnique({
            where: { symbol },
            select: {
                id: true,
                symbol: true,
                name: true,
                dhanSecurityId: true,
            },
        });

        if (!stock) {
            return NextResponse.json(
                { error: 'Stock not found' },
                { status: 404 }
            );
        }

        // Fetch intraday data from Dhan
        const dhanClient = getDhanClient();

        // For now, return mock data structure
        // TODO: Implement actual Dhan API call when intraday endpoint is available
        const mockCandles = generateMockIntradayData(symbol, interval);

        const responseData = {
            symbol: stock.symbol,
            name: stock.name,
            interval,
            candles: mockCandles,
        };

        // Cache for 1 minute (intraday data changes frequently)
        await cache.set(cacheKey, responseData, 60);

        return NextResponse.json({
            success: true,
            data: responseData,
        });
    } catch (error) {
        console.error('Error fetching intraday data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch intraday data' },
            { status: 500 }
        );
    }
}

// Mock data generator for development
function generateMockIntradayData(symbol: string, interval: string) {
    const candles = [];
    const now = new Date();
    const marketOpen = new Date(now);
    marketOpen.setHours(9, 15, 0, 0);

    const intervalMinutes = parseInt(interval);
    const candleCount = Math.floor((6 * 60) / intervalMinutes); // 6 hours of market

    let basePrice = 15700; // Starting price

    for (let i = 0; i < candleCount; i++) {
        const timestamp = new Date(marketOpen.getTime() + i * intervalMinutes * 60 * 1000);

        // Random walk
        const change = (Math.random() - 0.5) * 50;
        const open = basePrice;
        const close = basePrice + change;
        const high = Math.max(open, close) + Math.random() * 20;
        const low = Math.min(open, close) - Math.random() * 20;
        const volume = Math.floor(Math.random() * 50000) + 10000;

        candles.push({
            timestamp: timestamp.toISOString(),
            open: Math.round(open * 100) / 100,
            high: Math.round(high * 100) / 100,
            low: Math.round(low * 100) / 100,
            close: Math.round(close * 100) / 100,
            volume,
        });

        basePrice = close;
    }

    return candles;
}
