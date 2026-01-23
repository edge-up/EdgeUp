import { NextRequest, NextResponse } from 'next/server';
import { TokenStorage } from '@/lib/dhan/token-storage';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/refresh-dhan-token
 * Cron job to check and notify when Dhan token needs refresh
 * Run this daily to monitor token status
 */
export async function GET(request: NextRequest) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = TokenStorage.getToken();

        if (!token) {
            console.warn('⚠️ [CRON] No Dhan token found - authentication required');
            return NextResponse.json({
                success: false,
                message: 'No token found. Authentication required.',
                action: 'Visit /admin/dhan-setup to authenticate',
            });
        }

        const hoursUntilExpiry = TokenStorage.getTimeUntilExpiry(token.expiryTime);
        const needsRefresh = TokenStorage.needsRefresh(token.expiryTime);

        if (needsRefresh) {
            console.warn(`⚠️ [CRON] Dhan token expires in ${hoursUntilExpiry} hours - refresh needed`);

            // In a production setup, you could:
            // 1. Send email notification to admin
            // 2. Trigger Slack/Discord webhook
            // 3. Log to monitoring service

            return NextResponse.json({
                success: false,
                needsRefresh: true,
                hoursUntilExpiry,
                expiryTime: token.expiryTime,
                message: `Token expires in ${hoursUntilExpiry} hours. Please visit /admin/dhan-setup to refresh.`,
                action: 'User must manually refresh via OAuth flow at /admin/dhan-setup',
            });
        }

        console.log(`✅ [CRON] Dhan token is valid for ${hoursUntilExpiry} more hours`);

        return NextResponse.json({
            success: true,
            needsRefresh: false,
            hoursUntilExpiry,
            expiryTime: token.expiryTime,
            clientName: token.clientName,
            message: 'Token is valid',
        });
    } catch (error) {
        console.error('❌ [CRON] Token refresh check failed:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to check token',
            },
            { status: 500 }
        );
    }
}
