import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getStockEngine } from '@/lib/engines/stock-engine';
import { getSnapshotEngine } from '@/lib/engines/snapshot-engine';
import { getSectorEngine } from '@/lib/engines/sector-engine';
import { formatTimeIST, getCurrentIST } from '@/lib/utils/market-time';

export const dynamic = 'force-dynamic';

interface RouteParams {
    params: {
        sectorId: string;
    };
}

/**
 * GET /api/sectors/[sectorId]/stocks
 * Returns qualifying stocks in a specific sector
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { sectorId } = params;

        const snapshotEngine = getSnapshotEngine();
        const stockEngine = getStockEngine();
        const sectorEngine = getSectorEngine();

        // Get sector info
        const sector = await sectorEngine.getSectorById(sectorId);
        if (!sector) {
            return NextResponse.json(
                { success: false, error: 'Sector not found' },
                { status: 404 }
            );
        }

        // Check if we should use frozen snapshot
        const isFrozen = await snapshotEngine.isSnapshotFrozen();

        if (isFrozen) {
            // Return snapshot data
            const snapshot = await snapshotEngine.getLatestSnapshot();
            if (!snapshot) {
                return NextResponse.json({
                    success: true,
                    data: {
                        sector,
                        stocks: [],
                        snapshotTime: null,
                        isFrozen: true,
                        message: 'No snapshot available',
                    },
                });
            }

            const stocks = await snapshotEngine.getSnapshotStocks(snapshot.id, sectorId);
            const watchlistStocks = await snapshotEngine.getSnapshotWatchlistStocks(snapshot.id, sectorId);

            return NextResponse.json({
                success: true,
                data: {
                    sector,
                    stocks,
                    watchlistStocks,
                    snapshotTime: snapshot.snapshotTime,
                    isFrozen: true,
                    tradingDate: snapshot.tradingDate,
                },
            });
        }

        // Return live data with both qualifying and watchlist stocks
        const { qualifyingStocks, watchlistStocks } = await stockEngine.getPriceQualifiedStocksWithOI(sectorId);

        return NextResponse.json({
            success: true,
            data: {
                sector,
                stocks: qualifyingStocks,
                watchlistStocks,
                snapshotTime: null,
                isFrozen: false,
                timestamp: formatTimeIST(getCurrentIST()),
                message: 'Live data - snapshot will freeze at 09:30 AM IST',
            },
        });
    } catch (error) {
        console.error('GET /api/sectors/[sectorId]/stocks error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch stocks' },
            { status: 500 }
        );
    }
}
