import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';

/**
 * DELETE /api/alerts/[id]
 * Delete an alert
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;

        // Find the alert and verify ownership
        const alert = await prisma.alert.findUnique({
            where: { id }
        });

        if (!alert) {
            return NextResponse.json(
                { success: false, error: 'Alert not found' },
                { status: 404 }
            );
        }

        if (alert.userId !== session.user.id) {
            return NextResponse.json(
                { success: false, error: 'Not authorized' },
                { status: 403 }
            );
        }

        await prisma.alert.delete({
            where: { id }
        });

        return NextResponse.json({
            success: true,
            message: 'Alert deleted'
        });
    } catch (error) {
        console.error('DELETE /api/alerts/[id] error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete alert' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/alerts/[id]
 * Toggle alert active status
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body = await request.json();
        const { isActive } = body;

        const alert = await prisma.alert.findUnique({
            where: { id }
        });

        if (!alert) {
            return NextResponse.json(
                { success: false, error: 'Alert not found' },
                { status: 404 }
            );
        }

        if (alert.userId !== session.user.id) {
            return NextResponse.json(
                { success: false, error: 'Not authorized' },
                { status: 403 }
            );
        }

        const updatedAlert = await prisma.alert.update({
            where: { id },
            data: { isActive: isActive !== undefined ? isActive : !alert.isActive }
        });

        return NextResponse.json({
            success: true,
            data: { alert: updatedAlert }
        });
    } catch (error) {
        console.error('PATCH /api/alerts/[id] error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update alert' },
            { status: 500 }
        );
    }
}
