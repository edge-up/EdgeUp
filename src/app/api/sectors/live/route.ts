import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSectorEngine } from '@/lib/engines/sector-engine';

/**
 * GET /api/sectors/live
 * Always returns live/fresh sector data, bypassing any frozen snapshot
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const sectorEngine = getSectorEngine();

        // Force refresh to get live data
        const sectors = await sectorEngine.getAllSectors(true);
        const qualifyingSectors = sectors.filter(s => s.isQualifying);

        return NextResponse.json({
            success: true,
            data: {
                sectors: qualifyingSectors,
                allSectors: sectors,
                snapshotTime: null,
                isFrozen: false, // Always live
                isLiveMode: true,
                timestamp: new Date().toISOString(),
                summary: {
                    totalSectors: qualifyingSectors.length,
                    totalStocks: qualifyingSectors.reduce((acc, s) => acc + (s.qualifyingStockCount || 0), 0),
                    bullishSectors: qualifyingSectors.filter(s => s.direction === 'UP').length,
                    bearishSectors: qualifyingSectors.filter(s => s.direction === 'DOWN').length,
                },
            },
        });
    } catch (error) {
        console.error('GET /api/sectors/live error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch live sectors' },
            { status: 500 }
        );
    }
}
