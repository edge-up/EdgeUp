import { NextRequest, NextResponse } from 'next/server';
import { getDhanAuthService } from '@/lib/dhan/dhan-auth';
import { TokenStorage } from '@/lib/dhan/token-storage';

// This endpoint can be called by a cron job or manually to refresh the token
export const dynamic = 'force-dynamic';

/**
 * POST /api/dhan/auth/refresh
 * Manually trigger token refresh
 * This can be called by a cron job or when token is about to expire
 */
export async function POST(request: NextRequest) {
    try {
        const currentToken = TokenStorage.getToken();

        if (!currentToken) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'No existing token found. Please authenticate first via /admin/dhan-setup',
                },
                { status: 400 }
            );
        }

        // Check if token actually needs refresh
        const hoursUntilExpiry = TokenStorage.getTimeUntilExpiry(currentToken.expiryTime);

        if (hoursUntilExpiry > 12) {
            return NextResponse.json({
                success: true,
                message: 'Token is still valid and does not need refresh yet',
                hoursUntilExpiry,
                expiryTime: currentToken.expiryTime,
            });
        }

        console.log('🔄 Token refresh required. Initiating OAuth flow...');

        // Generate new consent
        const authService = getDhanAuthService();
        const consent = await authService.generateConsent();
        const loginUrl = authService.getBrowserLoginUrl(consent.consentAppId);

        // Return login URL for manual completion
        // Note: Automatic refresh requires user to complete browser login
        return NextResponse.json({
            success: false,
            requiresUserAction: true,
            message: 'Token refresh requires user authentication',
            loginUrl,
            consentAppId: consent.consentAppId,
            instructions: 'Please visit the loginUrl in a browser to complete authentication',
        });
    } catch (error) {
        console.error('❌ Token refresh error:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to refresh token',
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/dhan/auth/refresh
 * Check if token needs refresh
 */
export async function GET(request: NextRequest) {
    try {
        const currentToken = TokenStorage.getToken();

        if (!currentToken) {
            return NextResponse.json({
                needsRefresh: true,
                authenticated: false,
                message: 'No token found. Please authenticate.',
            });
        }

        const hoursUntilExpiry = TokenStorage.getTimeUntilExpiry(currentToken.expiryTime);
        const needsRefresh = hoursUntilExpiry <= 12;

        return NextResponse.json({
            needsRefresh,
            authenticated: true,
            hoursUntilExpiry,
            expiryTime: currentToken.expiryTime,
            clientName: currentToken.clientName,
            message: needsRefresh
                ? 'Token needs refresh within 12 hours'
                : 'Token is valid',
        });
    } catch (error) {
        console.error('❌ Refresh check error:', error);

        return NextResponse.json(
            {
                needsRefresh: true,
                error: error instanceof Error ? error.message : 'Failed to check token status',
            },
            { status: 500 }
        );
    }
}
