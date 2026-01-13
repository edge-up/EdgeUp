import prisma from '@/lib/db/prisma';
import { getDhanClient } from '@/lib/dhan/dhan-client';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache/redis';
import { StockData, Direction } from '@/types';
import { calculatePercentChange, getDirection, isQualifying } from '@/lib/utils/market-time';

/**
 * Stock Calculation Engine
 * Handles stock data fetching, F&O filtering, and momentum calculation
 */
export class StockEngine {
    private dhanClient = getDhanClient();

    /**
     * Get all stocks in a sector with current data
     * @param sectorId Sector ID to fetch stocks for
     * @param forceRefresh Skip cache and fetch fresh data
     */
    async getStocksInSector(sectorId: string, forceRefresh: boolean = false): Promise<StockData[]> {
        const cacheKey = CACHE_KEYS.LIVE_STOCKS(sectorId);

        // Check cache first
        if (!forceRefresh) {
            const cached = await cache.get<StockData[]>(cacheKey);
            if (cached) return cached;
        }

        // Get sector info
        const sector = await prisma.sector.findUnique({
            where: { id: sectorId },
        });

        if (!sector) {
            throw new Error(`Sector not found: ${sectorId}`);
        }

        // Get stocks in this sector
        const constituents = await prisma.sectorConstituent.findMany({
            where: { sectorId },
            include: {
                stock: true,
            },
        });

        if (constituents.length === 0) {
            return [];
        }

        // Get security IDs for Dhan API
        const stocks = constituents.map(c => c.stock);
        const securityIds = stocks
            .filter(s => s.dhanSecurityId)
            .map(s => s.dhanSecurityId as string);

        try {
            // Fetch quotes from Dhan API
            const quotes = securityIds.length > 0
                ? await this.dhanClient.getQuotes(securityIds)
                : [];
            const quoteMap = new Map(quotes.map(q => [q.securityId, q]));

            // Calculate stock data
            const stockData: StockData[] = stocks.map(stock => {
                const quote = stock.dhanSecurityId ? quoteMap.get(stock.dhanSecurityId) : null;

                const ltp = quote?.ltp || 0;
                const previousClose = quote?.previousClose || quote?.close || 0;
                const percentChange = calculatePercentChange(ltp, previousClose);
                const direction = getDirection(percentChange);
                const qualifying = isQualifying(percentChange) && stock.isFOEligible;

                return {
                    id: stock.id,
                    symbol: stock.symbol,
                    name: stock.name,
                    sectorId: sector.id,
                    sectorName: sector.name,
                    dhanSecurityId: stock.dhanSecurityId,
                    ltp,
                    previousClose,
                    percentChange: Math.round(percentChange * 100) / 100,
                    direction,
                    isFOEligible: stock.isFOEligible,
                    isQualifying: qualifying,
                    volume: quote?.volume,
                    open: quote?.open,
                    high: quote?.high,
                    low: quote?.low,
                };
            });

            // Sort by absolute percent change (highest movers first)
            stockData.sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange));

            // Cache the results
            await cache.set(cacheKey, stockData, CACHE_TTL.LIVE_DATA);

            return stockData;
        } catch (error) {
            console.error('StockEngine.getStocksInSector error:', error);
            throw error;
        }
    }

    /**
     * Get only qualifying stocks in a sector
     * Qualifying = F&O eligible + ≥±1% change
     */
    async getQualifyingStocks(sectorId: string, forceRefresh: boolean = false): Promise<StockData[]> {
        const allStocks = await this.getStocksInSector(sectorId, forceRefresh);
        return allStocks.filter(s => s.isQualifying);
    }

    /**
     * Get qualifying stocks across all qualifying sectors
     */
    async getAllQualifyingStocks(qualifyingSectorIds: string[]): Promise<StockData[]> {
        const allStocks: StockData[] = [];

        for (const sectorId of qualifyingSectorIds) {
            const stocks = await this.getQualifyingStocks(sectorId);
            allStocks.push(...stocks);
        }

        // Remove duplicates (a stock may appear in multiple sectors)
        const uniqueStocks = new Map<string, StockData>();
        allStocks.forEach(stock => {
            // If stock already exists, keep the one with higher % change context
            // But we want to show in each sector, so we use composite key
            const key = `${stock.id}-${stock.sectorId}`;
            uniqueStocks.set(key, stock);
        });

        return Array.from(uniqueStocks.values());
    }

    /**
     * Get a single stock by symbol with current data
     */
    async getStockBySymbol(symbol: string): Promise<StockData | null> {
        const stock = await prisma.stock.findUnique({
            where: { symbol },
            include: {
                sectors: {
                    include: {
                        sector: true,
                    },
                },
            },
        });

        if (!stock || !stock.dhanSecurityId) {
            return null;
        }

        const sectorInfo = stock.sectors[0]?.sector;
        if (!sectorInfo) {
            return null;
        }

        try {
            const quotes = await this.dhanClient.getQuotes([stock.dhanSecurityId]);
            const quote = quotes[0];

            if (!quote) {
                return null;
            }

            const percentChange = calculatePercentChange(quote.ltp, quote.previousClose);

            return {
                id: stock.id,
                symbol: stock.symbol,
                name: stock.name,
                sectorId: sectorInfo.id,
                sectorName: sectorInfo.name,
                dhanSecurityId: stock.dhanSecurityId,
                ltp: quote.ltp,
                previousClose: quote.previousClose,
                percentChange: Math.round(percentChange * 100) / 100,
                direction: getDirection(percentChange),
                isFOEligible: stock.isFOEligible,
                isQualifying: isQualifying(percentChange) && stock.isFOEligible,
                volume: quote.volume,
                open: quote.open,
                high: quote.high,
                low: quote.low,
            };
        } catch (error) {
            console.error('StockEngine.getStockBySymbol error:', error);
            return null;
        }
    }

    /**
     * Refresh F&O eligibility from database
     */
    async refreshFOEligibility(): Promise<void> {
        const foList = await prisma.fOMaster.findMany({
            where: { isActive: true },
            select: { symbol: true, lotSize: true },
        });

        const foSymbols = new Set(foList.map(f => f.symbol));

        // Update all stocks
        await prisma.stock.updateMany({
            where: { symbol: { notIn: Array.from(foSymbols) } },
            data: { isFOEligible: false },
        });

        // Mark F&O eligible stocks
        for (const fo of foList) {
            await prisma.stock.updateMany({
                where: { symbol: fo.symbol },
                data: { isFOEligible: true, lotSize: fo.lotSize },
            });
        }
    }
}

// Singleton instance
let stockEngineInstance: StockEngine | null = null;

export function getStockEngine(): StockEngine {
    if (!stockEngineInstance) {
        stockEngineInstance = new StockEngine();
    }
    return stockEngineInstance;
}

export default StockEngine;
