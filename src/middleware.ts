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
        // Dashboard routes (NOT /dashboard/demo)
        '/dashboard/live/:path*',
        '/dashboard/sectors/:path*',
        // API routes (NOT /api/sectors/demo*)
        '/api/sectors/live/:path*',
        '/api/snapshot/:path*',
        // Individual sector stocks endpoint (NOT demo)
        '/api/sectors/:sectorId/stocks',
    ],
};
