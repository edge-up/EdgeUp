import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
    const token = await getToken({ req: request });

    if (!token) {
        const { pathname } = request.nextUrl;
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Only protect these specific dashboard routes (NOT demo)
        '/dashboard/live/:path*',
        '/dashboard/sectors/:path*',
        // Protect non-demo API routes
        '/api/sectors/live/:path*',
        '/api/sectors/:sectorId((?!demo$).*)/stocks',
        '/api/snapshot/:path*',
    ],
};
