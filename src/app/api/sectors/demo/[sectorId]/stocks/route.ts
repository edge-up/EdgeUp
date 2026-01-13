import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { StockData } from '@/types';

export const dynamic = 'force-dynamic';

interface RouteParams {
    params: {
        sectorId: string;
    };
}

/**
 * GET /api/sectors/demo/[sectorId]/stocks
 * Returns mock stock data for UI testing
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { sectorId } = params;

        // Mock sector mapping
        const sectorMap: Record<string, { name: string; stocks: StockData[] }> = {
            '2': {
                name: 'NIFTY IT',
                stocks: [
                    {
                        id: 's1',
                        symbol: 'TCS',
                        name: 'Tata Consultancy Services Ltd',
                        sectorId: '2',
                        sectorName: 'NIFTY IT',
                        dhanSecurityId: 'TCS_EQ',
                        ltp: 3845.60,
                        previousClose: 3780.00,
                        percentChange: 1.74,
                        direction: 'UP',
                        isFOEligible: true,
                        isQualifying: true,
                        volume: 2450000,
                        open: 3790.50,
                        high: 3850.00,
                        low: 3785.25,
                    },
                    {
                        id: 's2',
                        symbol: 'INFY',
                        name: 'Infosys Ltd',
                        sectorId: '2',
                        sectorName: 'NIFTY IT',
                        dhanSecurityId: 'INFY_EQ',
                        ltp: 1542.80,
                        previousClose: 1520.50,
                        percentChange: 1.47,
                        direction: 'UP',
                        isFOEligible: true,
                        isQualifying: true,
                        volume: 5230000,
                        open: 1525.00,
                        high: 1545.75,
                        low: 1522.30,
                    },
                    {
                        id: 's3',
                        symbol: 'HCLTECH',
                        name: 'HCL Technologies Ltd',
                        sectorId: '2',
                        sectorName: 'NIFTY IT',
                        dhanSecurityId: 'HCLTECH_EQ',
                        ltp: 1385.25,
                        previousClose: 1366.00,
                        percentChange: 1.41,
                        direction: 'UP',
                        isFOEligible: true,
                        isQualifying: true,
                        volume: 3180000,
                        open: 1368.50,
                        high: 1388.00,
                        low: 1365.75,
                    },
                    {
                        id: 's4',
                        symbol: 'WIPRO',
                        name: 'Wipro Ltd',
                        sectorId: '2',
                        sectorName: 'NIFTY IT',
                        dhanSecurityId: 'WIPRO_EQ',
                        ltp: 485.90,
                        previousClose: 479.50,
                        percentChange: 1.33,
                        direction: 'UP',
                        isFOEligible: true,
                        isQualifying: true,
                        volume: 6750000,
                        open: 480.25,
                        high: 487.50,
                        low: 479.00,
                    },
                    {
                        id: 's5',
                        symbol: 'LTIM',
                        name: 'LTIMindtree Ltd',
                        sectorId: '2',
                        sectorName: 'NIFTY IT',
                        dhanSecurityId: 'LTIM_EQ',
                        ltp: 5280.40,
                        previousClose: 5215.00,
                        percentChange: 1.25,
                        direction: 'UP',
                        isFOEligible: true,
                        isQualifying: true,
                        volume: 890000,
                        open: 5220.00,
                        high: 5295.00,
                        low: 5212.50,
                    },
                    {
                        id: 's6',
                        symbol: 'TECHM',
                        name: 'Tech Mahindra Ltd',
                        sectorId: '2',
                        sectorName: 'NIFTY IT',
                        dhanSecurityId: 'TECHM_EQ',
                        ltp: 1648.75,
                        previousClose: 1628.00,
                        percentChange: 1.27,
                        direction: 'UP',
                        isFOEligible: true,
                        isQualifying: true,
                        volume: 2340000,
                        open: 1630.50,
                        high: 1652.00,
                        low: 1627.25,
                    },
                ],
            },
            '5': {
                name: 'NIFTY METAL',
                stocks: [
                    {
                        id: 's7',
                        symbol: 'TATASTEEL',
                        name: 'Tata Steel Ltd',
                        sectorId: '5',
                        sectorName: 'NIFTY METAL',
                        dhanSecurityId: 'TATASTEEL_EQ',
                        ltp: 138.45,
                        previousClose: 140.50,
                        percentChange: -1.46,
                        direction: 'DOWN',
                        isFOEligible: true,
                        isQualifying: true,
                        volume: 15600000,
                        open: 140.25,
                        high: 140.75,
                        low: 138.10,
                    },
                    {
                        id: 's8',
                        symbol: 'HINDALCO',
                        name: 'Hindalco Industries Ltd',
                        sectorId: '5',
                        sectorName: 'NIFTY METAL',
                        dhanSecurityId: 'HINDALCO_EQ',
                        ltp: 618.30,
                        previousClose: 627.50,
                        percentChange: -1.47,
                        direction: 'DOWN',
                        isFOEligible: true,
                        isQualifying: true,
                        volume: 7890000,
                        open: 626.00,
                        high: 627.00,
                        low: 617.50,
                    },
                    {
                        id: 's9',
                        symbol: 'JSWSTEEL',
                        name: 'JSW Steel Ltd',
                        sectorId: '5',
                        sectorName: 'NIFTY METAL',
                        dhanSecurityId: 'JSWSTEEL_EQ',
                        ltp: 895.60,
                        previousClose: 908.25,
                        percentChange: -1.39,
                        direction: 'DOWN',
                        isFOEligible: true,
                        isQualifying: true,
                        volume: 4560000,
                        open: 906.50,
                        high: 908.00,
                        low: 893.75,
                    },
                    {
                        id: 's10',
                        symbol: 'VEDL',
                        name: 'Vedanta Ltd',
                        sectorId: '5',
                        sectorName: 'NIFTY METAL',
                        dhanSecurityId: 'VEDL_EQ',
                        ltp: 445.80,
                        previousClose: 452.50,
                        percentChange: -1.48,
                        direction: 'DOWN',
                        isFOEligible: true,
                        isQualifying: true,
                        volume: 9870000,
                        open: 451.75,
                        high: 452.00,
                        low: 444.25,
                    },
                ],
            },
        };

        const sectorData = sectorMap[sectorId];
        if (!sectorData) {
            return NextResponse.json(
                { success: false, error: 'Demo sector not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                sector: {
                    id: sectorId,
                    name: sectorData.name,
                    symbol: sectorData.name.replace('NIFTY ', 'NIFTY_'),
                    currentValue: 0,
                    previousClose: 0,
                    percentChange: 0,
                    direction: 'NEUTRAL' as const,
                    qualifyingStockCount: sectorData.stocks.length,
                    isQualifying: true,
                },
                stocks: sectorData.stocks,
                snapshotTime: null,
                isFrozen: false,
                timestamp: new Date().toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                    timeZone: 'Asia/Kolkata',
                }),
                message: '🎭 DEMO MODE - Sample stock data',
            },
        });
    } catch (error) {
        console.error('GET /api/sectors/demo/[sectorId]/stocks error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch demo stocks' },
            { status: 500 }
        );
    }
}
