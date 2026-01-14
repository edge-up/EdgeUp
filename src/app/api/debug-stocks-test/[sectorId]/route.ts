import { NextRequest, NextResponse } from 'next/server';
import { getStockEngine } from '@/lib/engines/stock-engine';
import { getSectorEngine } from '@/lib/engines/sector-engine';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug-stocks-test/[sectorId]
 * TEMPORARY DEBUG ENDPOINT - DELETE AFTER DEBUGGING
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { sectorId: string } }
) {
    try {
        const sectorId = params.sectorId;
        console.log('Debug: Starting with sectorId:', sectorId);

        const stockEngine = getStockEngine();
        const sectorEngine = getSectorEngine();

        // Get sector info
        console.log('Debug: Getting sector by ID');
        const sector = await sectorEngine.getSectorById(sectorId);
        if (!sector) {
            return NextResponse.json({
                success: false,
                error: 'Sector not found',
                providedSectorId: sectorId,
            }, { status: 404 });
        }

        console.log('Debug: Sector found:', sector.name);

        // Get stocks with OI data
        console.log('Debug: Getting price qualified stocks with OI');
        const { qualifyingStocks, watchlistStocks } = await stockEngine.getPriceQualifiedStocksWithOI(sectorId);

        console.log('Debug: Results - qualifying:', qualifyingStocks.length, 'watchlist:', watchlistStocks.length);

        return NextResponse.json({
            success: true,
            data: {
                sectorId,
                sectorName: sector.name,
                qualifyingStocksCount: qualifyingStocks.length,
                watchlistStocksCount: watchlistStocks.length,
                qualifyingStocks,
                watchlistStocks,
            },
        });
    } catch (error) {
        console.error('GET /api/debug-stocks-test error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed',
            stack: error instanceof Error ? error.stack : undefined,
        }, { status: 500 });
    }
}
