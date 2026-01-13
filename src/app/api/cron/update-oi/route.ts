import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getDhanClient } from '@/lib/dhan/dhan-client';

export const dynamic = 'force-dynamic';

/**
 * Pre-Market OI Update Cron Job
 * Runs at 6:30 AM IST (Mon-Fri) before market opens
 * 
 * Purpose: Fetch previous day's closing OI for ALL F&O stocks
 * This enables accurate OI change calculation during 9:15-9:25 AM analysis
 */
export async function GET(request: NextRequest) {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🕕 Starting pre-market OI update...');
    const startTime = Date.now();

    try {
        const dhanClient = getDhanClient();

        // Step 1: Get all F&O eligible stocks with their FNO security IDs
        const foStocks = await prisma.stock.findMany({
            where: {
                isFOEligible: true,
                isActive: true,
                dhanFNOSecurityId: { not: null }, // Must have FNO ID for OI data
            },
            select: {
                id: true,
                symbol: true,
                dhanFNOSecurityId: true,
            },
        });

        console.log(`📊 Found ${foStocks.length} F&O stocks to update`);

        if (foStocks.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No F&O stocks found with FNO security IDs',
                duration: Date.now() - startTime,
            });
        }

        // Step 2: Batch fetch quotes for all FNO securities
        const securityIds = foStocks
            .map((s: { dhanFNOSecurityId: string | null }) => s.dhanFNOSecurityId)
            .filter((id): id is string => id !== null);

        let quotes;
        try {
            quotes = await dhanClient.getQuotes(securityIds);
        } catch (error) {
            console.error('Failed to fetch quotes from Dhan:', error);
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch quotes from Dhan API',
            }, { status: 500 });
        }

        // Create a map of securityId -> OI
        const oiMap = new Map<string, number>();
        quotes.forEach(q => {
            if (q.openInterest && q.openInterest > 0) {
                oiMap.set(q.securityId, q.openInterest);
            }
        });

        console.log(`📈 Received OI data for ${oiMap.size} securities`);

        // Step 3: Update each stock's previousDayOI
        const now = new Date();
        let updatedCount = 0;
        let failedCount = 0;

        for (const stock of foStocks) {
            const oi = oiMap.get(stock.dhanFNOSecurityId!);

            if (oi && oi > 0) {
                try {
                    await prisma.stock.update({
                        where: { id: stock.id },
                        data: {
                            previousDayOI: BigInt(oi),
                            lastOIUpdate: now,
                        },
                    });
                    updatedCount++;
                } catch (err) {
                    console.error(`Failed to update OI for ${stock.symbol}:`, err);
                    failedCount++;
                }
            }
        }

        const duration = Date.now() - startTime;
        console.log(`✅ OI update complete: ${updatedCount} updated, ${failedCount} failed in ${duration}ms`);

        return NextResponse.json({
            success: true,
            updated: updatedCount,
            failed: failedCount,
            total: foStocks.length,
            duration,
            timestamp: now.toISOString(),
        });

    } catch (error) {
        console.error('❌ Pre-market OI update failed:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
