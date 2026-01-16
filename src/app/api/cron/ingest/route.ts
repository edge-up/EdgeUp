import { NextRequest, NextResponse } from 'next/server';
import { getSnapshotEngine } from '@/lib/engines/snapshot-engine';
import { isAfterSnapshotTime, getTradingDate } from '@/lib/utils/market-time';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/ingest
 * Called by Vercel cron to ingest market data and create snapshot
 * Schedule: every minute from 9:00-9:29 AM, Mon-Fri
 */
export async function POST(request: NextRequest) {
    try {
        // Verify cron secret
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const snapshotEngine = getSnapshotEngine();
        const today = getTradingDate();

        // Check if it's a trading day
        const calendar = await prisma.tradingCalendar.findUnique({
            where: { date: today },
        });

        if (calendar?.isHoliday) {
            return NextResponse.json({
                success: true,
                message: `Today is a holiday: ${calendar.holidayName}`,
                action: 'skipped',
            });
        }

        // Check if snapshot should be created (after 09:30 AM)
        if (isAfterSnapshotTime()) {
            // Check if snapshot already exists
            const existingSnapshot = await prisma.snapshot.findUnique({
                where: { tradingDate: today },
            });

            if (existingSnapshot?.status === 'COMPLETED') {
                return NextResponse.json({
                    success: true,
                    message: 'Snapshot already exists for today',
                    action: 'skipped',
                    snapshotId: existingSnapshot.id,
                });
            }

            // Create snapshot
            const snapshot = await snapshotEngine.createSnapshot();

            return NextResponse.json({
                success: true,
                message: 'Snapshot created successfully',
                action: 'created',
                snapshot: {
                    id: snapshot.id,
                    tradingDate: snapshot.tradingDate,
                    totalSectors: snapshot.totalSectors,
                    totalStocks: snapshot.totalStocks,
                },
            });
        }

        // Before snapshot time - just log that we're monitoring
        return NextResponse.json({
            success: true,
            message: 'Monitoring market data, waiting for 09:30 AM',
            action: 'monitoring',
        });
    } catch (error) {
        console.error('POST /api/cron/ingest error:', error);
        return NextResponse.json(
            { success: false, error: 'Cron job failed' },
            { status: 500 }
        );
    }
}

// Also support GET for manual testing
export async function GET(request: NextRequest) {
    return POST(request);
}
