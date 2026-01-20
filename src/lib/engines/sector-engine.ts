import prisma from '@/lib/db/prisma';
import { getDhanClient } from '@/lib/dhan/dhan-client';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache/redis';
import { SectorData, Direction } from '@/types';
import { calculatePercentChange, getDirection, isQualifying } from '@/lib/utils/market-time';

/**
 * Sector Calculation Engine
 * Handles sector index data fetching and momentum calculation
 */
export class SectorEngine {
    private dhanClient = getDhanClient();

    /**
     * Get all sectors with current data
     * @param forceRefresh Skip cache and fetch fresh data
     */
    async getAllSectors(forceRefresh: boolean = false): Promise<SectorData[]> {
        // Check cache first
        if (!forceRefresh) {
            const cached = await cache.get<SectorData[]>(CACHE_KEYS.LIVE_SECTORS);
            if (cached) return cached;
        }

        // Fetch sectors from database - only select needed fields
        const sectors = await prisma.sector.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                symbol: true,
                dhanSecurityId: true,
            },
            orderBy: { name: 'asc' },
        });

        if (sectors.length === 0) {
            return [];
        }

        // Get security IDs for Dhan API
        const securityIds = sectors
            .filter(s => s.dhanSecurityId)
            .map(s => s.dhanSecurityId as string);

        if (securityIds.length === 0) {
            // Return sectors with placeholder data if no Dhan IDs
            return sectors.map(s => ({
                id: s.id,
                name: s.name,
                symbol: s.symbol,
                dhanSecurityId: s.dhanSecurityId,
                currentValue: 0,
                previousClose: 0,
                percentChange: 0,
                direction: 'NEUTRAL' as Direction,
                qualifyingStockCount: 0,
                isQualifying: false,
            }));
        }

        try {
            // Fetch quotes from Dhan API
            const quotes = await this.dhanClient.getQuotes(securityIds);
            const quoteMap = new Map(quotes.map(q => [q.securityId, q]));

            // Calculate sector data
            const sectorData: SectorData[] = await Promise.all(
                sectors.map(async sector => {
                    const quote = sector.dhanSecurityId ? quoteMap.get(sector.dhanSecurityId) : null;

                    const currentValue = quote?.ltp || 0;
                    const previousClose = quote?.previousClose || quote?.close || 0;
                    const percentChange = calculatePercentChange(currentValue, previousClose);
                    const direction = getDirection(percentChange);
                    const qualifying = isQualifying(percentChange);

                    // Get qualifying stock count
                    const qualifyingStockCount = qualifying
                        ? await this.getQualifyingStockCount(sector.id)
                        : 0;

                    return {
                        id: sector.id,
                        name: sector.name,
                        symbol: sector.symbol,
                        dhanSecurityId: sector.dhanSecurityId,
                        currentValue,
                        previousClose,
                        percentChange: Math.round(percentChange * 100) / 100,
                        direction,
                        qualifyingStockCount,
                        isQualifying: qualifying,
                    };
                })
            );

            // Cache the results
            await cache.set(CACHE_KEYS.LIVE_SECTORS, sectorData, CACHE_TTL.LIVE_DATA);

            return sectorData;
        } catch (error) {
            console.error('SectorEngine.getAllSectors error:', error);
            throw error;
        }
    }

    /**
     * Get only qualifying sectors (≥±1% change)
     */
    async getQualifyingSectors(forceRefresh: boolean = false): Promise<SectorData[]> {
        const allSectors = await this.getAllSectors(forceRefresh);
        return allSectors.filter(s => s.isQualifying);
    }

    /**
     * Get a single sector by ID with current data
     */
    async getSectorById(sectorId: string): Promise<SectorData | null> {
        const allSectors = await this.getAllSectors();
        return allSectors.find(s => s.id === sectorId) || null;
    }

    /**
     * Get count of qualifying stocks in a sector
     */
    private async getQualifyingStockCount(sectorId: string): Promise<number> {
        // This is a simplified count - the actual calculation happens in StockEngine
        const constituents = await prisma.sectorConstituent.count({
            where: {
                sectorId,
                stock: {
                    isActive: true,
                    isFOEligible: true,
                },
            },
        });
        return constituents;
    }

    /**
     * Get sector constituents (stock IDs in a sector)
     */
    async getSectorConstituents(sectorId: string): Promise<string[]> {
        const constituents = await prisma.sectorConstituent.findMany({
            where: { sectorId },
            select: { stockId: true },
        });
        return constituents.map(c => c.stockId);
    }
}

// Singleton instance
let sectorEngineInstance: SectorEngine | null = null;

export function getSectorEngine(): SectorEngine {
    if (!sectorEngineInstance) {
        sectorEngineInstance = new SectorEngine();
    }
    return sectorEngineInstance;
}

export default SectorEngine;
