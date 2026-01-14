import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public routes without authentication
    if (
        pathname.startsWith('/demo') ||
        pathname.startsWith('/api/sectors/demo') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/register') ||
        pathname.startsWith('/api/auth')
    ) {
        return NextResponse.next();
    }

    // Check for authentication on protected routes
    const token = await getToken({ req: request });

    if (!token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Protect dashboard routes
        '/dashboard/:path*',
        // Protect API routes  
        '/api/sectors/:path*',
        '/api/snapshot/:path*',
    ],
};
