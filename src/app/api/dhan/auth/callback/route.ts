import { NextRequest, NextResponse } from 'next/server';
import { getDhanAuthService } from '@/lib/dhan/dhan-auth';
import { TokenStorage } from '@/lib/dhan/token-storage';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/dhan/auth/callback?tokenId=xxx
 * Step 3 of OAuth flow: Handle callback from Dhan and exchange tokenId for accessToken
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const tokenId = searchParams.get('tokenId');

        if (!tokenId) {
            return NextResponse.redirect(
                new URL('/admin/dhan-setup?error=missing_token_id', request.url)
            );
        }

        console.log('📥 Received tokenId from Dhan callback');

        const authService = getDhanAuthService();

        // Exchange tokenId for accessToken
        const tokenData = await authService.consumeConsent(tokenId);

        // Save to storage
        await TokenStorage.saveToken({
            accessToken: tokenData.accessToken,
            expiryTime: tokenData.expiryTime,
            clientId: tokenData.dhanClientId,
            clientName: tokenData.dhanClientName,
            lastRefreshed: new Date().toISOString(),
        });

        console.log('✅ Token saved successfully for', tokenData.dhanClientName);

        // Redirect to setup page with success message
        return NextResponse.redirect(
            new URL('/admin/dhan-setup?success=true', request.url)
        );
    } catch (error) {
        console.error('❌ OAuth callback error:', error);

        return NextResponse.redirect(
            new URL(
                `/admin/dhan-setup?error=${encodeURIComponent(
                    error instanceof Error ? error.message : 'Authentication failed'
                )}`,
                request.url
            )
        );
    }
}
