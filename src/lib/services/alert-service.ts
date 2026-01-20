import prisma from '@/lib/db/prisma';
import { AlertType, NotificationType } from '@prisma/client';

/**
 * Alert Service
 * Checks active alerts and triggers notifications when conditions are met
 */

interface SnapshotData {
    id: string;
    tradingDate: Date;
    sectorSnapshots: Array<{
        sectorId: string;
        isQualifying: boolean;
        percentChange: number;
        sector: {
            name: string;
            symbol: string;
        };
    }>;
    stockSnapshots: Array<{
        stockId: string;
        isQualifying: boolean;
        percentChange: number;
        stock: {
            symbol: string;
            name: string;
        };
    }>;
}

/**
 * Check all active alerts and trigger notifications
 */
export async function checkAndTriggerAlerts(snapshot: SnapshotData): Promise<void> {
    try {
        // Get all active alerts
        const alerts = await prisma.alert.findMany({
            where: { isActive: true },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
        });

        console.log(`Checking ${alerts.length} active alerts against snapshot ${snapshot.id}`);

        // Check each alert
        for (const alert of alerts) {
            try {
                const shouldTrigger = await checkAlert(alert, snapshot);

                if (shouldTrigger) {
                    await createNotificationForAlert(alert, snapshot);
                }
            } catch (error) {
                console.error(`Error checking alert ${alert.id}:`, error);
            }
        }
    } catch (error) {
        console.error('Error in checkAndTriggerAlerts:', error);
    }
}

/**
 * Check if an alert should trigger based on snapshot data
 */
async function checkAlert(alert: any, snapshot: SnapshotData): Promise<boolean> {
    switch (alert.type) {
        case 'SECTOR_QUALIFYING':
            return checkSectorQualifyingAlert(alert, snapshot);

        case 'STOCK_BREAKOUT':
            return checkStockBreakoutAlert(alert, snapshot);

        case 'DAILY_SUMMARY':
            // Daily summary always triggers once per snapshot
            return true;

        default:
            return false;
    }
}

/**
 * Check if sector qualifying alert should trigger
 */
function checkSectorQualifyingAlert(alert: any, snapshot: SnapshotData): boolean {
    if (alert.targetType !== 'SECTOR') return false;

    const sectorSnapshot = snapshot.sectorSnapshots.find(
        s => s.sectorId === alert.targetId
    );

    if (!sectorSnapshot) return false;

    // Trigger if sector is qualifying
    return sectorSnapshot.isQualifying;
}

/**
 * Check if stock breakout alert should trigger
 */
function checkStockBreakoutAlert(alert: any, snapshot: SnapshotData): boolean {
    if (alert.targetType !== 'STOCK') return false;

    const stockSnapshot = snapshot.stockSnapshots.find(
        s => s.stockId === alert.targetId
    );

    if (!stockSnapshot) return false;

    // Trigger if stock is qualifying (breakout condition)
    return stockSnapshot.isQualifying;
}

/**
 * Create notification for triggered alert
 */
async function createNotificationForAlert(alert: any, snapshot: SnapshotData): Promise<void> {
    let title = '';
    let message = '';
    let type: NotificationType = 'ALERT_TRIGGERED';

    switch (alert.type) {
        case 'SECTOR_QUALIFYING': {
            const sectorSnapshot = snapshot.sectorSnapshots.find(
                s => s.sectorId === alert.targetId
            );
            if (sectorSnapshot) {
                title = '🎯 Sector Alert Triggered';
                message = `${sectorSnapshot.sector.name} is now qualifying with ${sectorSnapshot.percentChange > 0 ? '+' : ''}${sectorSnapshot.percentChange.toFixed(2)}% move`;
                type = 'SECTOR_ALERT';
            }
            break;
        }

        case 'STOCK_BREAKOUT': {
            const stockSnapshot = snapshot.stockSnapshots.find(
                s => s.stockId === alert.targetId
            );
            if (stockSnapshot) {
                title = '📈 Stock Breakout Alert';
                message = `${stockSnapshot.stock.symbol} broke out with ${stockSnapshot.percentChange > 0 ? '+' : ''}${stockSnapshot.percentChange.toFixed(2)}% move`;
                type = 'STOCK_ALERT';
            }
            break;
        }

        case 'DAILY_SUMMARY': {
            const qualifyingSectors = snapshot.sectorSnapshots.filter(s => s.isQualifying).length;
            const qualifyingStocks = snapshot.stockSnapshots.filter(s => s.isQualifying).length;
            title = '📊 Daily Snapshot Complete';
            message = `${qualifyingSectors} qualifying sectors, ${qualifyingStocks} qualifying stocks`;
            type = 'SYSTEM_MESSAGE';
            break;
        }
    }

    if (title && message) {
        await prisma.notification.create({
            data: {
                userId: alert.userId,
                title,
                message,
                type,
                isRead: false,
            },
        });

        console.log(`Created notification for user ${alert.userId}: ${title}`);
    }
}
