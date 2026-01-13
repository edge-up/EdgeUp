import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSnapshotEngine } from '@/lib/engines/snapshot-engine';
import { getNextSnapshotTime, formatDateTimeIST } from '@/lib/utils/market-time';

/**
 * GET /api/snapshot/latest
 * Returns the latest frozen snapshot
 */
export async function GET() {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const snapshotEngine = getSnapshotEngine();
        const isFrozen = await snapshotEngine.isSnapshotFrozen();
        const snapshot = await snapshotEngine.getLatestSnapshot();

        return NextResponse.json({
            success: true,
            data: {
                snapshot,
                isFrozen,
                nextSnapshotAt: formatDateTimeIST(getNextSnapshotTime()),
            },
        });
    } catch (error) {
        console.error('GET /api/snapshot/latest error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch snapshot' },
            { status: 500 }
        );
    }
}
