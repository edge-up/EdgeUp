import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSectorEngine } from '@/lib/engines/sector-engine';
import { getSnapshotEngine } from '@/lib/engines/snapshot-engine';
import { isAfterSnapshotTime, formatTimeIST, getCurrentIST } from '@/lib/utils/market-time';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sectors
 * Returns qualifying sectors with current/snapshot data
 */
export async function GET() {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const snapshotEngine = getSnapshotEngine();
        const sectorEngine = getSectorEngine();

        // Check if we should use frozen snapshot
        const isFrozen = await snapshotEngine.isSnapshotFrozen();

        if (isFrozen) {
            // Return snapshot data
            const snapshot = await snapshotEngine.getLatestSnapshot();
            if (!snapshot) {
                return NextResponse.json({
                    success: true,
                    data: {
                        sectors: [],
                        snapshotTime: null,
                        isFrozen: true,
                        message: 'No snapshot available',
                    },
                });
            }

            return NextResponse.json({
                success: true,
                data: {
                    sectors: snapshot.sectors,
                    snapshotTime: snapshot.snapshotTime,
                    isFrozen: true,
                    tradingDate: snapshot.tradingDate,
                    summary: {
                        totalSectors: snapshot.totalSectors,
                        totalStocks: snapshot.totalStocks,
                        bullishSectors: snapshot.bullishSectors,
                        bearishSectors: snapshot.bearishSectors,
                    },
                },
            });
        }

        // Return live data
        const sectors = await sectorEngine.getQualifyingSectors();

        return NextResponse.json({
            success: true,
            data: {
                sectors,
                snapshotTime: null,
                isFrozen: false,
                timestamp: formatTimeIST(getCurrentIST()),
                message: 'Live data - snapshot will freeze at 09:25 AM IST',
            },
        });
    } catch (error) {
        console.error('GET /api/sectors error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch sectors' },
            { status: 500 }
        );
    }
}
