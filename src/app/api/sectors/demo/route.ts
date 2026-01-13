import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SectorData } from '@/types';

/**
 * GET /api/sectors/demo
 * Returns mock sector data for UI testing without Dhan API
 */
export async function GET() {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Mock sector data showing various scenarios
        const mockSectors: SectorData[] = [
            // Bullish sectors
            {
                id: '1',
                name: 'NIFTY BANK',
                symbol: 'NIFTY_BANK',
                dhanSecurityId: 'BANK_NIFTY',
                currentValue: 48250.75,
                previousClose: 47800.50,
                percentChange: 0.94,
                direction: 'UP',
                qualifyingStockCount: 8,
                isQualifying: false, // Just below 1%
            },
            {
                id: '2',
                name: 'NIFTY IT',
                symbol: 'NIFTY_IT',
                dhanSecurityId: 'NIFTY_IT',
                currentValue: 35480.25,
                previousClose: 34950.00,
                percentChange: 1.52,
                direction: 'UP',
                qualifyingStockCount: 6,
                isQualifying: true, // Qualifying - above 1%
            },
            {
                id: '3',
                name: 'NIFTY AUTO',
                symbol: 'NIFTY_AUTO',
                dhanSecurityId: 'NIFTY_AUTO',
                currentValue: 21350.80,
                previousClose: 21050.25,
                percentChange: 1.43,
                direction: 'UP',
                qualifyingStockCount: 4,
                isQualifying: true, // Qualifying
            },
            {
                id: '4',
                name: 'NIFTY PHARMA',
                symbol: 'NIFTY_PHARMA',
                dhanSecurityId: 'NIFTY_PHARMA',
                currentValue: 18925.40,
                previousClose: 18680.00,
                percentChange: 1.31,
                direction: 'UP',
                qualifyingStockCount: 5,
                isQualifying: true, // Qualifying
            },

            // Bearish sectors
            {
                id: '5',
                name: 'NIFTY METAL',
                symbol: 'NIFTY_METAL',
                dhanSecurityId: 'NIFTY_METAL',
                currentValue: 8520.15,
                previousClose: 8630.50,
                percentChange: -1.28,
                direction: 'DOWN',
                qualifyingStockCount: 4,
                isQualifying: true, // Qualifying - below -1%
            },
            {
                id: '6',
                name: 'NIFTY ENERGY',
                symbol: 'NIFTY_ENERGY',
                dhanSecurityId: 'NIFTY_ENERGY',
                currentValue: 36180.90,
                previousClose: 36680.00,
                percentChange: -1.36,
                direction: 'DOWN',
                qualifyingStockCount: 3,
                isQualifying: true, // Qualifying
            },

            // Neutral - not qualifying
            {
                id: '7',
                name: 'NIFTY FMCG',
                symbol: 'NIFTY_FMCG',
                dhanSecurityId: 'NIFTY_FMCG',
                currentValue: 52340.25,
                previousClose: 52150.00,
                percentChange: 0.36,
                direction: 'UP',
                qualifyingStockCount: 0,
                isQualifying: false, // Not qualifying
            },
        ];

        // Filter qualifying sectors
        const qualifyingSectors = mockSectors.filter(s => s.isQualifying);
        const bullishCount = qualifyingSectors.filter(s => s.direction === 'UP').length;
        const bearishCount = qualifyingSectors.filter(s => s.direction === 'DOWN').length;
        const totalStocks = qualifyingSectors.reduce((sum, s) => sum + s.qualifyingStockCount, 0);

        return NextResponse.json({
            success: true,
            data: {
                sectors: qualifyingSectors,
                snapshotTime: null,
                isFrozen: false,
                timestamp: new Date().toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                    timeZone: 'Asia/Kolkata',
                }),
                message: '🎭 DEMO MODE - Sample market data',
                summary: {
                    totalSectors: qualifyingSectors.length,
                    totalStocks,
                    bullishSectors: bullishCount,
                    bearishSectors: bearishCount,
                },
            },
        });
    } catch (error) {
        console.error('GET /api/sectors/demo error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch demo sectors' },
            { status: 500 }
        );
    }
}
