import { NextRequest, NextResponse } from 'next/server';
import { getDhanAuthService } from '@/lib/dhan/dhan-auth';

/**
 * POST /api/dhan/auth/generate-consent
 * Step 1 of OAuth flow: Generate consent and return login URL
 */
export async function POST(request: NextRequest) {
    try {
        const authService = getDhanAuthService();

        // Generate consent
        const consent = await authService.generateConsent();

        // Get browser login URL
        const loginUrl = authService.getBrowserLoginUrl(consent.consentAppId);

        return NextResponse.json({
            success: true,
            consentAppId: consent.consentAppId,
            loginUrl,
            message: 'Consent generated successfully. Please complete authentication in browser.',
        });
    } catch (error) {
        console.error('❌ Generate consent error:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to generate consent',
            },
            { status: 500 }
        );
    }
}
