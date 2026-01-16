import { NextResponse } from 'next/server';
import { getMarketStatus } from '@/lib/utils/market-status';

export const dynamic = 'force-dynamic';

/**
 * Market Status API
 * Returns whether market is currently open, and if not, why
 */
export async function GET() {
    try {
        const status = await getMarketStatus();

        return NextResponse.json(status);
    } catch (error) {
        console.error('Error getting market status:', error);

        // Fallback response if database fails
        return NextResponse.json({
            isOpen: false,
            isTradingDay: false,
            reason: 'Unable to determine market status',
        });
    }
}
