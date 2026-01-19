import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';

/**
 * GET /api/snapshots/[date]
 * Get detailed snapshot for a specific trading date
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ date: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { date } = await params;

        // Parse the date (expected format: YYYY-MM-DD)
        const tradingDate = new Date(date);
        tradingDate.setHours(0, 0, 0, 0);

        if (isNaN(tradingDate.getTime())) {
            return NextResponse.json(
                { success: false, error: 'Invalid date format. Use YYYY-MM-DD' },
                { status: 400 }
            );
        }

        // Get the snapshot for this date
        const snapshot = await prisma.snapshot.findUnique({
            where: { tradingDate },
            include: {
                sectorSnapshots: {
                    include: {
                        sector: {
                            select: { id: true, name: true, symbol: true }
                        }
                    },
                    orderBy: [
                        { isQualifying: 'desc' },
                        { percentChange: 'desc' }
                    ]
                },
                stockSnapshots: {
                    where: { isQualifying: true },
                    include: {
                        stock: {
                            select: { id: true, symbol: true, name: true, isFOEligible: true }
                        }
                    },
                    orderBy: { percentChange: 'desc' }
                }
            }
        });

        if (!snapshot) {
            return NextResponse.json(
                { success: false, error: 'No snapshot found for this date' },
                { status: 404 }
            );
        }

        // Format sectors
        const sectors = snapshot.sectorSnapshots.map(ss => ({
            id: ss.sector.id,
            name: ss.sector.name,
            symbol: ss.sector.symbol,
            currentValue: ss.currentValue,
            previousClose: ss.previousClose,
            percentChange: ss.percentChange,
            direction: ss.direction,
            qualifyingStocks: ss.qualifyingStocks,
            isQualifying: ss.isQualifying,
        }));

        // Format stocks
        const stocks = snapshot.stockSnapshots.map(ss => ({
            id: ss.stock.id,
            symbol: ss.stock.symbol,
            name: ss.stock.name,
            ltp: ss.ltp,
            previousClose: ss.previousClose,
            percentChange: ss.percentChange,
            direction: ss.direction,
            isFOEligible: ss.stock.isFOEligible,
            openInterest: ss.openInterest ? Number(ss.openInterest) : null,
            previousOI: ss.previousOI ? Number(ss.previousOI) : null,
            oiChangePercent: ss.previousOI && ss.openInterest
                ? ((Number(ss.openInterest) - Number(ss.previousOI)) / Number(ss.previousOI)) * 100
                : null,
        }));

        // Summary stats
        const qualifyingSectors = sectors.filter(s => s.isQualifying);
        const bullishSectors = qualifyingSectors.filter(s => s.direction === 'UP');
        const bearishSectors = qualifyingSectors.filter(s => s.direction === 'DOWN');

        return NextResponse.json({
            success: true,
            data: {
                snapshot: {
                    id: snapshot.id,
                    tradingDate: snapshot.tradingDate.toISOString().split('T')[0],
                    snapshotTime: snapshot.snapshotTime.toISOString(),
                    status: snapshot.status,
                },
                summary: {
                    totalSectors: sectors.length,
                    qualifyingSectors: qualifyingSectors.length,
                    bullishSectors: bullishSectors.length,
                    bearishSectors: bearishSectors.length,
                    totalQualifyingStocks: stocks.length,
                },
                sectors,
                qualifyingStocks: stocks,
            }
        });
    } catch (error) {
        console.error('GET /api/snapshots/[date] error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch snapshot' },
            { status: 500 }
        );
    }
}
