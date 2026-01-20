import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cache } from '@/lib/cache/redis';

/**
 * GET /api/cache/stats
 * Get cache statistics for monitoring
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        // Only allow admins to view cache stats
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const stats = cache.getStats();

        return NextResponse.json({
            success: true,
            data: {
                timestamp: new Date().toISOString(),
                stats,
            }
        });
    } catch (error) {
        console.error('GET /api/cache/stats error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch cache stats' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/cache/stats
 * Clear all caches (admin only)
 */
export async function DELETE() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Clear all caches
        await cache.delPattern('live:*');
        await cache.delPattern('quotes:*');

        return NextResponse.json({
            success: true,
            message: 'Cache cleared'
        });
    } catch (error) {
        console.error('DELETE /api/cache/stats error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to clear cache' },
            { status: 500 }
        );
    }
}
