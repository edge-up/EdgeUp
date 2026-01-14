import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getStockEngine } from '@/lib/engines/stock-engine';
import prisma from '@/lib/db/prisma';

/**
 * GET /api/sectors/live/[sectorId]/stocks
 * Always returns live/fresh stock data, bypassing any frozen snapshot
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ sectorId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { sectorId } = await params;

        // Get sector info
        const sector = await prisma.sector.findUnique({
            where: { id: sectorId },
            select: { id: true, name: true, symbol: true },
        });

        if (!sector) {
            return NextResponse.json(
                { success: false, error: 'Sector not found' },
                { status: 404 }
            );
        }

        const stockEngine = getStockEngine();

        // Force refresh to get live data with both qualifying and watchlist stocks
        const { qualifyingStocks, watchlistStocks } = await stockEngine.getPriceQualifiedStocksWithOI(sectorId, true);

        return NextResponse.json({
            success: true,
            data: {
                sector,
                stocks: qualifyingStocks,
                watchlistStocks,
                snapshotTime: null,
                isFrozen: false, // Always live
                isLiveMode: true,
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('GET /api/sectors/live/[sectorId]/stocks error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch live stocks' },
            { status: 500 }
        );
    }
}
