import prisma from '@/lib/db/prisma';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache/redis';
import { getSectorEngine } from './sector-engine';
import { getStockEngine } from './stock-engine';
import { SnapshotData, SectorData, StockData } from '@/types';
import {
    getTradingDate,
    getCurrentIST,
    isAfterSnapshotTime,
    formatDateTimeIST
} from '@/lib/utils/market-time';

/**
 * Snapshot Engine
 * Handles freezing and persisting market data at 09:30 AM IST
 */
export class SnapshotEngine {
    private sectorEngine = getSectorEngine();
    private stockEngine = getStockEngine();

    /**
     * Create a new snapshot at the current time
     * This should be called at 09:30 AM IST
     */
    async createSnapshot(): Promise<SnapshotData> {
        const tradingDate = getTradingDate();
        const snapshotTime = getCurrentIST();

        console.log(`Creating snapshot for ${formatDateTimeIST(tradingDate)} at ${formatDateTimeIST(snapshotTime)}`);

        // Check if snapshot already exists for today
        const existingSnapshot = await prisma.snapshot.findUnique({
            where: { tradingDate },
        });

        if (existingSnapshot && existingSnapshot.status === 'COMPLETED') {
            console.log('Snapshot already exists for today');
            return this.getSnapshotData(existingSnapshot.id);
        }

        // Create or update snapshot record
        const snapshot = await prisma.snapshot.upsert({
            where: { tradingDate },
            create: {
                tradingDate,
                snapshotTime,
                status: 'PROCESSING',
            },
            update: {
                snapshotTime,
                status: 'PROCESSING',
            },
        });

        try {
            // Fetch current sector data
            const sectors = await this.sectorEngine.getAllSectors(true);
            const qualifyingSectors = sectors.filter(s => s.isQualifying);

            let totalStocks = 0;
            let bullishSectors = 0;
            let bearishSectors = 0;

            // Save sector snapshots
            for (const sector of sectors) {
                // Get BOTH qualifying and watchlist stocks for this sector
                const { qualifyingStocks, watchlistStocks } = sector.isQualifying
                    ? await this.stockEngine.getPriceQualifiedStocksWithOI(sector.id, true)
                    : { qualifyingStocks: [], watchlistStocks: [] };

                await prisma.sectorSnapshot.upsert({
                    where: {
                        snapshotId_sectorId: {
                            snapshotId: snapshot.id,
                            sectorId: sector.id,
                        },
                    },
                    create: {
                        snapshotId: snapshot.id,
                        sectorId: sector.id,
                        currentValue: sector.currentValue,
                        previousClose: sector.previousClose,
                        percentChange: sector.percentChange,
                        direction: sector.direction,
                        qualifyingStocks: qualifyingStocks.length,
                        isQualifying: sector.isQualifying,
                    },
                    update: {
                        currentValue: sector.currentValue,
                        previousClose: sector.previousClose,
                        percentChange: sector.percentChange,
                        direction: sector.direction,
                        qualifyingStocks: qualifyingStocks.length,
                        isQualifying: sector.isQualifying,
                    },
                });

                if (sector.isQualifying) {
                    if (sector.direction === 'UP') bullishSectors++;
                    if (sector.direction === 'DOWN') bearishSectors++;

                    // Save QUALIFYING stock snapshots
                    for (const stock of qualifyingStocks) {
                        await prisma.stockSnapshot.upsert({
                            where: {
                                snapshotId_stockId_sectorId: {
                                    snapshotId: snapshot.id,
                                    stockId: stock.id,
                                    sectorId: sector.id,
                                },
                            },
                            create: {
                                snapshotId: snapshot.id,
                                stockId: stock.id,
                                sectorId: sector.id,
                                ltp: stock.ltp,
                                previousClose: stock.previousClose,
                                percentChange: stock.percentChange,
                                direction: stock.direction,
                                isFOEligible: stock.isFOEligible,
                                isQualifying: true, // Fully qualifies
                                volume: stock.volume ? BigInt(stock.volume) : null,
                                openPrice: stock.open,
                                highPrice: stock.high,
                                lowPrice: stock.low,
                                openInterest: stock.openInterest ? BigInt(stock.openInterest) : null,
                                previousOI: stock.previousOpenInterest ? BigInt(stock.previousOpenInterest) : null,
                            },
                            update: {
                                ltp: stock.ltp,
                                previousClose: stock.previousClose,
                                percentChange: stock.percentChange,
                                direction: stock.direction,
                                isFOEligible: stock.isFOEligible,
                                isQualifying: true,
                                volume: stock.volume ? BigInt(stock.volume) : null,
                                openPrice: stock.open,
                                highPrice: stock.high,
                                lowPrice: stock.low,
                                openInterest: stock.openInterest ? BigInt(stock.openInterest) : null,
                                previousOI: stock.previousOpenInterest ? BigInt(stock.previousOpenInterest) : null,
                            },
                        });
                        totalStocks++;
                    }

                    // Save WATCHLIST stock snapshots (price >= 1% but OI < 7%)
                    for (const stock of watchlistStocks) {
                        await prisma.stockSnapshot.upsert({
                            where: {
                                snapshotId_stockId_sectorId: {
                                    snapshotId: snapshot.id,
                                    stockId: stock.id,
                                    sectorId: sector.id,
                                },
                            },
                            create: {
                                snapshotId: snapshot.id,
                                stockId: stock.id,
                                sectorId: sector.id,
                                ltp: stock.ltp,
                                previousClose: stock.previousClose,
                                percentChange: stock.percentChange,
                                direction: stock.direction,
                                isFOEligible: stock.isFOEligible,
                                isQualifying: false, // Watchlist - not fully qualifying
                                volume: stock.volume ? BigInt(stock.volume) : null,
                                openPrice: stock.open,
                                highPrice: stock.high,
                                lowPrice: stock.low,
                                openInterest: stock.openInterest ? BigInt(stock.openInterest) : null,
                                previousOI: stock.previousOpenInterest ? BigInt(stock.previousOpenInterest) : null,
                            },
                            update: {
                                ltp: stock.ltp,
                                previousClose: stock.previousClose,
                                percentChange: stock.percentChange,
                                direction: stock.direction,
                                isFOEligible: stock.isFOEligible,
                                isQualifying: false,
                                volume: stock.volume ? BigInt(stock.volume) : null,
                                openPrice: stock.open,
                                highPrice: stock.high,
                                lowPrice: stock.low,
                                openInterest: stock.openInterest ? BigInt(stock.openInterest) : null,
                                previousOI: stock.previousOpenInterest ? BigInt(stock.previousOpenInterest) : null,
                            },
                        });
                    }
                }
            }

            // Update snapshot with totals
            await prisma.snapshot.update({
                where: { id: snapshot.id },
                data: {
                    status: 'COMPLETED',
                    totalSectors: qualifyingSectors.length,
                    totalStocks,
                    bullishSectors,
                    bearishSectors,
                },
            });

            // Cache the snapshot
            const snapshotData = await this.getSnapshotData(snapshot.id);
            await cache.set(CACHE_KEYS.LATEST_SNAPSHOT, snapshotData, CACHE_TTL.SNAPSHOT);

            console.log(`Snapshot created: ${qualifyingSectors.length} qualifying sectors, ${totalStocks} stocks`);

            return snapshotData;
        } catch (error) {
            // Mark snapshot as failed
            await prisma.snapshot.update({
                where: { id: snapshot.id },
                data: { status: 'FAILED' },
            });
            console.error('SnapshotEngine.createSnapshot error:', error);
            throw error;
        }
    }

    /**
     * Get the latest snapshot
     */
    async getLatestSnapshot(): Promise<SnapshotData | null> {
        // Check cache first
        const cached = await cache.get<SnapshotData>(CACHE_KEYS.LATEST_SNAPSHOT);
        if (cached) return cached;

        // Get from database
        const snapshot = await prisma.snapshot.findFirst({
            where: { status: 'COMPLETED' },
            orderBy: { tradingDate: 'desc' },
        });

        if (!snapshot) return null;

        const snapshotData = await this.getSnapshotData(snapshot.id);

        // Cache if it's today's snapshot
        const today = getTradingDate();
        if (snapshot.tradingDate.getTime() === today.getTime()) {
            await cache.set(CACHE_KEYS.LATEST_SNAPSHOT, snapshotData, CACHE_TTL.SNAPSHOT);
        }

        return snapshotData;
    }

    /**
     * Get snapshot data by ID
     */
    async getSnapshotData(snapshotId: string): Promise<SnapshotData> {
        const snapshot = await prisma.snapshot.findUnique({
            where: { id: snapshotId },
            include: {
                sectorSnapshots: {
                    where: { isQualifying: true },
                    include: {
                        sector: true,
                    },
                    orderBy: {
                        percentChange: 'desc',
                    },
                },
            },
        });

        if (!snapshot) {
            throw new Error(`Snapshot not found: ${snapshotId}`);
        }

        const sectors: SectorData[] = snapshot.sectorSnapshots.map(ss => ({
            id: ss.sector.id,
            name: ss.sector.name,
            symbol: ss.sector.symbol,
            dhanSecurityId: ss.sector.dhanSecurityId,
            currentValue: ss.currentValue,
            previousClose: ss.previousClose,
            percentChange: ss.percentChange,
            direction: ss.direction as 'UP' | 'DOWN' | 'NEUTRAL',
            qualifyingStockCount: ss.qualifyingStocks,
            isQualifying: ss.isQualifying,
        }));

        return {
            id: snapshot.id,
            tradingDate: snapshot.tradingDate.toISOString().split('T')[0],
            snapshotTime: snapshot.snapshotTime.toISOString(),
            status: snapshot.status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
            totalSectors: snapshot.totalSectors,
            totalStocks: snapshot.totalStocks,
            bullishSectors: snapshot.bullishSectors,
            bearishSectors: snapshot.bearishSectors,
            sectors,
        };
    }

    /**
     * Get stocks from a snapshot for a specific sector
     */
    async getSnapshotStocks(snapshotId: string, sectorId: string): Promise<StockData[]> {
        const stockSnapshots = await prisma.stockSnapshot.findMany({
            where: {
                snapshotId,
                sectorId,
                isQualifying: true,
            },
            include: {
                stock: true,
            },
            orderBy: {
                percentChange: 'desc',
            },
        });

        const sector = await prisma.sector.findUnique({
            where: { id: sectorId },
        });

        return stockSnapshots.map(ss => {
            const currentOI = ss.openInterest ? Number(ss.openInterest) : 0;
            const previousOI = ss.previousOI ? Number(ss.previousOI) : 0;
            let oiChangePercent = 0;
            if (previousOI > 0 && currentOI > 0) {
                oiChangePercent = ((currentOI - previousOI) / previousOI) * 100;
            }

            return {
                id: ss.stock.id,
                symbol: ss.stock.symbol,
                name: ss.stock.name,
                sectorId: sectorId,
                sectorName: sector?.name || '',
                dhanSecurityId: ss.stock.dhanSecurityId,
                ltp: ss.ltp,
                previousClose: ss.previousClose,
                percentChange: ss.percentChange,
                direction: ss.direction as 'UP' | 'DOWN' | 'NEUTRAL',
                isFOEligible: ss.isFOEligible,
                isQualifying: ss.isQualifying,
                volume: ss.volume ? Number(ss.volume) : undefined,
                open: ss.openPrice || undefined,
                high: ss.highPrice || undefined,
                low: ss.lowPrice || undefined,
                openInterest: currentOI,
                previousOpenInterest: previousOI,
                oiChangePercent: Math.round(oiChangePercent * 100) / 100,
            };
        });
    }

    /**
     * Get WATCHLIST stocks from a snapshot for a specific sector
     * These are stocks with price >= 1% but OI < 7%
     */
    async getSnapshotWatchlistStocks(snapshotId: string, sectorId: string): Promise<StockData[]> {
        const stockSnapshots = await prisma.stockSnapshot.findMany({
            where: {
                snapshotId,
                sectorId,
                isQualifying: false, // Watchlist stocks
            },
            include: {
                stock: true,
            },
            orderBy: {
                percentChange: 'desc',
            },
        });

        const sector = await prisma.sector.findUnique({
            where: { id: sectorId },
        });

        return stockSnapshots.map(ss => {
            const currentOI = ss.openInterest ? Number(ss.openInterest) : 0;
            const previousOI = ss.previousOI ? Number(ss.previousOI) : 0;
            let oiChangePercent = 0;
            if (previousOI > 0 && currentOI > 0) {
                oiChangePercent = ((currentOI - previousOI) / previousOI) * 100;
            }

            return {
                id: ss.stock.id,
                symbol: ss.stock.symbol,
                name: ss.stock.name,
                sectorId: sectorId,
                sectorName: sector?.name || '',
                dhanSecurityId: ss.stock.dhanSecurityId,
                ltp: ss.ltp,
                previousClose: ss.previousClose,
                percentChange: ss.percentChange,
                direction: ss.direction as 'UP' | 'DOWN' | 'NEUTRAL',
                isFOEligible: ss.isFOEligible,
                isQualifying: ss.isQualifying,
                volume: ss.volume ? Number(ss.volume) : undefined,
                open: ss.openPrice || undefined,
                high: ss.highPrice || undefined,
                low: ss.lowPrice || undefined,
                openInterest: currentOI,
                previousOpenInterest: previousOI,
                oiChangePercent: Math.round(oiChangePercent * 100) / 100,
            };
        });
    }

    /**
     * Check if today's snapshot is frozen
     */
    async isSnapshotFrozen(): Promise<boolean> {
        if (!isAfterSnapshotTime()) return false;

        const today = getTradingDate();
        const snapshot = await prisma.snapshot.findUnique({
            where: { tradingDate: today },
        });

        return snapshot?.status === 'COMPLETED';
    }

    /**
     * Cleanup old snapshots (older than 7 days)
     */
    async cleanupOldSnapshots(): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 7);

        const result = await prisma.snapshot.deleteMany({
            where: {
                tradingDate: { lt: cutoffDate },
            },
        });

        console.log(`Cleaned up ${result.count} old snapshots`);
        return result.count;
    }

    /**
     * Get historical snapshots (last 7 days)
     */
    async getHistoricalSnapshots(days: number = 7): Promise<SnapshotData[]> {
        const snapshots = await prisma.snapshot.findMany({
            where: { status: 'COMPLETED' },
            orderBy: { tradingDate: 'desc' },
            take: days,
        });

        return Promise.all(snapshots.map(s => this.getSnapshotData(s.id)));
    }
}

// Singleton instance
let snapshotEngineInstance: SnapshotEngine | null = null;

export function getSnapshotEngine(): SnapshotEngine {
    if (!snapshotEngineInstance) {
        snapshotEngineInstance = new SnapshotEngine();
    }
    return snapshotEngineInstance;
}

export default SnapshotEngine;
