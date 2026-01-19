import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';

/**
 * GET /api/notifications
 * List notifications for the current user
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get('unread') === 'true';
        const limit = parseInt(searchParams.get('limit') || '20');

        const notifications = await prisma.notification.findMany({
            where: {
                userId: session.user.id,
                ...(unreadOnly ? { isRead: false } : {})
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        const unreadCount = await prisma.notification.count({
            where: {
                userId: session.user.id,
                isRead: false
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                notifications,
                unreadCount
            }
        });
    } catch (error) {
        console.error('GET /api/notifications error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch notifications' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/notifications
 * Mark notifications as read
 */
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { ids, markAll } = body;

        if (markAll) {
            // Mark all as read
            await prisma.notification.updateMany({
                where: {
                    userId: session.user.id,
                    isRead: false
                },
                data: { isRead: true }
            });
        } else if (ids && Array.isArray(ids)) {
            // Mark specific notifications as read
            await prisma.notification.updateMany({
                where: {
                    id: { in: ids },
                    userId: session.user.id
                },
                data: { isRead: true }
            });
        } else {
            return NextResponse.json(
                { success: false, error: 'Provide ids array or markAll: true' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Notifications marked as read'
        });
    } catch (error) {
        console.error('PATCH /api/notifications error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update notifications' },
            { status: 500 }
        );
    }
}
