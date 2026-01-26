import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/snapshots
 * List all snapshots with summary info
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

        // Get all completed snapshots, ordered by date descending
        const snapshots = await prisma.snapshot.findMany({
            where: {
                status: 'COMPLETED',
            },
            orderBy: {
                tradingDate: 'desc',
            },
            select: {
                id: true,
                tradingDate: true,
                snapshotTime: true,
                status: true,
                totalSectors: true,
                totalStocks: true,
                bullishSectors: true,
                bearishSectors: true,
                createdAt: true,
                _count: {
                    select: {
                        sectorSnapshots: {
                            where: { isQualifying: true }
                        },
                        stockSnapshots: {
                            where: { isQualifying: true }
                        }
                    }
                }
            },
            take: 30, // Last 30 trading days
        });

        // Format the response
        const formattedSnapshots = snapshots.map(s => ({
            id: s.id,
            tradingDate: s.tradingDate.toISOString().split('T')[0],
            snapshotTime: s.snapshotTime.toISOString(),
            status: s.status,
            totalSectors: s.totalSectors,
            qualifyingSectors: s._count.sectorSnapshots,
            bullishSectors: s.bullishSectors,
            bearishSectors: s.bearishSectors,
            totalStocks: s.totalStocks,
            qualifyingStocks: s._count.stockSnapshots,
        }));

        return NextResponse.json({
            success: true,
            data: {
                snapshots: formattedSnapshots,
                total: formattedSnapshots.length,
            }
        });
    } catch (error) {
        console.error('GET /api/snapshots error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch snapshots' },
            { status: 500 }
        );
    }
}
