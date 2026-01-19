import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';

/**
 * GET /api/alerts
 * List all alerts for the current user
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const alerts = await prisma.alert.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
            success: true,
            data: { alerts }
        });
    } catch (error) {
        console.error('GET /api/alerts error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch alerts' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/alerts
 * Create a new alert
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { type, targetType, targetId, targetName, threshold } = body;

        // Validate required fields
        if (!type || !targetType || !targetId || !targetName) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check for existing similar alert
        const existingAlert = await prisma.alert.findFirst({
            where: {
                userId: session.user.id,
                type,
                targetType,
                targetId,
                isActive: true,
            }
        });

        if (existingAlert) {
            return NextResponse.json(
                { success: false, error: 'Similar alert already exists' },
                { status: 409 }
            );
        }

        const alert = await prisma.alert.create({
            data: {
                userId: session.user.id,
                type,
                targetType,
                targetId,
                targetName,
                threshold: threshold || null,
            }
        });

        return NextResponse.json({
            success: true,
            data: { alert }
        }, { status: 201 });
    } catch (error) {
        console.error('POST /api/alerts error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create alert' },
            { status: 500 }
        );
    }
}
