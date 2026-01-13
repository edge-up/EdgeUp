import { NextRequest, NextResponse } from 'next/server';
import { getSnapshotEngine } from '@/lib/engines/snapshot-engine';

/**
 * POST /api/cron/cleanup
 * Called by Vercel cron to cleanup old snapshots
 * Schedule: 0 0 * * * (daily at midnight)
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
        const deletedCount = await snapshotEngine.cleanupOldSnapshots();

        return NextResponse.json({
            success: true,
            message: `Cleaned up ${deletedCount} old snapshots`,
            deletedCount,
        });
    } catch (error) {
        console.error('POST /api/cron/cleanup error:', error);
        return NextResponse.json(
            { success: false, error: 'Cleanup failed' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    return POST(request);
}
