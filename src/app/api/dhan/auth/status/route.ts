import { NextRequest, NextResponse } from 'next/server';
import { TokenStorage } from '@/lib/dhan/token-storage';

/**
 * GET /api/dhan/auth/status
 * Check current Dhan authentication status
 */
export async function GET(request: NextRequest) {
    try {
        const token = TokenStorage.getToken();

        if (!token) {
            return NextResponse.json({
                isAuthenticated: false,
                message: 'No valid token found. Please authenticate.',
            });
        }

        const hoursUntilExpiry = TokenStorage.getTimeUntilExpiry(token.expiryTime);
        const daysUntilExpiry = Math.floor(hoursUntilExpiry / 24);
        const needsRefresh = TokenStorage.needsRefresh(token.expiryTime);

        return NextResponse.json({
            isAuthenticated: true,
            clientName: token.clientName,
            expiryTime: token.expiryTime,
            daysUntilExpiry,
            hoursUntilExpiry,
            needsRefresh,
            lastRefreshed: token.lastRefreshed,
        });
    } catch (error) {
        console.error('❌ Auth status check error:', error);

        return NextResponse.json(
            {
                isAuthenticated: false,
                error: error instanceof Error ? error.message : 'Failed to check auth status',
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/dhan/auth/status
 * Clear stored token (logout)
 */
export async function DELETE(request: NextRequest) {
    try {
        TokenStorage.clearToken();

        return NextResponse.json({
            success: true,
            message: 'Token cleared successfully',
        });
    } catch (error) {
        console.error('❌ Token clear error:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to clear token',
            },
            { status: 500 }
        );
    }
}
