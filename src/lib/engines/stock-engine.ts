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

        // Get security IDs for Dhan API (both equity for prices and FNO for OI)
        const stocks = constituents.map((c: any) => c.stock);
        const equitySecurityIds = stocks
            .filter((s: any) => s.dhanSecurityId)
            .map((s: any) => s.dhanSecurityId as string);
        const fnoSecurityIds = stocks
            .filter((s: any) => s.dhanFNOSecurityId && s.isFOEligible)
            .map((s: any) => s.dhanFNOSecurityId as string);

        try {
            // Fetch ALL quotes in a SINGLE API call (combine equity + FNO to avoid rate limits)
            const allSecurityIds = [...equitySecurityIds, ...fnoSecurityIds];
            const allQuotes = allSecurityIds.length > 0
                ? await this.dhanClient.getQuotes(allSecurityIds)
                : [];

            // Separate into equity and FNO maps
            const equityQuoteMap = new Map(allQuotes.filter(q => q.securityId.startsWith('NSE_EQ')).map(q => [q.securityId, q]));
            const fnoQuoteMap = new Map(allQuotes.filter(q => q.securityId.startsWith('NSE_FNO')).map(q => [q.securityId, q]));

            // Calculate stock data
            const stockData: StockData[] = stocks.map((stock: any) => {
                const equityQuote = stock.dhanSecurityId ? equityQuoteMap.get(stock.dhanSecurityId) : null;
                const fnoQuote = stock.dhanFNOSecurityId ? fnoQuoteMap.get(stock.dhanFNOSecurityId) : null;

                const ltp = equityQuote?.ltp || 0;
                const previousClose = equityQuote?.previousClose || equityQuote?.close || 0;
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
                    volume: equityQuote?.volume,
                    open: equityQuote?.open,
                    high: equityQuote?.high,
                    low: equityQuote?.low,
                    openInterest: fnoQuote?.openInterest || 0, // OI from FNO quote
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
     * Filters applied:
     * 1. Stock is in NSE F&O list (isFOEligible)
     * 2. Stock price change ≥ +1% or ≤ -1%
     * 3. OI change ≥ 7% (from previous day)
     * 4. Time window: 9:15–9:30 AM IST (optional, for live trading)
     */
    async getQualifyingStocks(sectorId: string, forceRefresh: boolean = false): Promise<StockData[]> {
        const allStocks = await this.getStocksInSector(sectorId, forceRefresh);

        // Step 1 & 2: Filter by F&O eligibility and price change >= 1%
        const priceQualifyingStocks = allStocks.filter(s => s.isQualifying);

        if (priceQualifyingStocks.length === 0) {
            return [];
        }

        // Step 3: Apply OI Change Filter (>= configured threshold)
        // Uses previousDayOI field populated by 6:30 AM pre-market cron
        const { OI_CHANGE_THRESHOLD } = await import('@/lib/config');
        const qualifiedStocks: StockData[] = [];

        // Get previousDayOI for stocks that passed price filter
        const stockIds = priceQualifyingStocks.map(s => s.id);
        const stocksWithOI = await prisma.stock.findMany({
            where: { id: { in: stockIds } },
            select: { id: true, previousDayOI: true, lastOIUpdate: true },
        });

        type StockOIData = { id: string; previousDayOI: bigint | null; lastOIUpdate: Date | null };
        const oiMap = new Map<string, StockOIData>(
            stocksWithOI.map((s: StockOIData) => [s.id, s])
        );

        for (const stock of priceQualifyingStocks) {
            const stockOI = oiMap.get(stock.id);
            const currentOI = stock.openInterest || 0;
            const previousOI = stockOI?.previousDayOI
                ? Number(stockOI.previousDayOI)
                : 0;

            let oiChangePercent = 0;
            if (previousOI > 0 && currentOI > 0) {
                oiChangePercent = ((currentOI - previousOI) / previousOI) * 100;
            }

            // Apply OI change filter: >= 7% increase OR decrease (absolute change)
            // If previous OI is 0 (no data from cron yet), skip OI filter for this stock
            const passesOIFilter = previousOI === 0 || Math.abs(oiChangePercent) >= OI_CHANGE_THRESHOLD;

            if (passesOIFilter) {
                qualifiedStocks.push({
                    ...stock,
                    previousOpenInterest: previousOI,
                    oiChangePercent: Math.round(oiChangePercent * 100) / 100,
                });
            }
        }

        // Step 4: Time window check (9:15-9:30 AM IST)
        // Note: This is commented out to allow testing outside market hours
        // Uncomment for production use during live trading
        /*
        const now = new Date();
        const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const hours = istTime.getHours();
        const minutes = istTime.getMinutes();
        const currentTimeMinutes = hours * 60 + minutes;
        const startTimeMinutes = 9 * 60 + 15; // 9:15 AM
        const endTimeMinutes = 9 * 60 + 30;   // 9:30 AM
        const isWithinTimeWindow = currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
        
        if (!isWithinTimeWindow) {
            return []; // Only return stocks during the analysis window
        }
        */

        return qualifiedStocks;
    }

    /**
     * Get all price-qualifying stocks with OI data (for watchlist display)
     * Returns stocks that pass price filter (≥1%) with their OI change info
     * Users can see why stocks don't fully qualify (OI < threshold)
     */
    async getPriceQualifiedStocksWithOI(sectorId: string, forceRefresh: boolean = false): Promise<{
        qualifyingStocks: StockData[];
        watchlistStocks: StockData[];
    }> {
        const allStocks = await this.getStocksInSector(sectorId, forceRefresh);

        // Filter by F&O eligibility and price change >= 1%
        const priceQualifyingStocks = allStocks.filter(s => s.isQualifying);

        if (priceQualifyingStocks.length === 0) {
            return { qualifyingStocks: [], watchlistStocks: [] };
        }

        // Enrich stocks with previous day OHLC data for breakout detection
        const enrichedStocks = await this.enrichWithPreviousDayOHLC(priceQualifyingStocks);

        // Get OI data and classify stocks
        const { OI_CHANGE_THRESHOLD } = await import('@/lib/config');
        const qualifyingStocks: StockData[] = [];
        const watchlistStocks: StockData[] = [];

        const stockIds = enrichedStocks.map(s => s.id);
        const stocksWithOI = await prisma.stock.findMany({
            where: { id: { in: stockIds } },
            select: { id: true, previousDayOI: true, lastOIUpdate: true },
        });

        type StockOIData = { id: string; previousDayOI: bigint | null; lastOIUpdate: Date | null };
        const oiMap = new Map<string, StockOIData>(
            stocksWithOI.map((s: StockOIData) => [s.id, s])
        );

        for (const stock of enrichedStocks) {
            const stockOI = oiMap.get(stock.id);
            const currentOI = stock.openInterest || 0;
            const previousOI = stockOI?.previousDayOI
                ? Number(stockOI.previousDayOI)
                : 0;

            let oiChangePercent = 0;
            if (previousOI > 0 && currentOI > 0) {
                oiChangePercent = ((currentOI - previousOI) / previousOI) * 100;
            }

            const stockWithOI = {
                ...stock,
                previousOpenInterest: previousOI,
                oiChangePercent: Math.round(oiChangePercent * 100) / 100,
            };

            // Apply filters
            const passesOIFilter = previousOI === 0 || Math.abs(oiChangePercent) >= OI_CHANGE_THRESHOLD;

            // Note: Breakout/breakdown info is enriched for display but NOT used as a filter
            // User can see breakout indicators in UI, but they don't affect qualification

            // Stock qualifies if it passes OI filter
            if (passesOIFilter) {
                qualifyingStocks.push(stockWithOI);
            } else {
                watchlistStocks.push(stockWithOI);
            }
        }

        return { qualifyingStocks, watchlistStocks };
    }

    /**
     * Enrich stocks with previous day OHLC data
     * Fetches in parallel with rate limiting considerations
     */
    private async enrichWithPreviousDayOHLC(stocks: StockData[]): Promise<StockData[]> {
        console.log(`📊 Enriching ${stocks.length} stocks with previous day OHLC...`);
        let successCount = 0;
        let failCount = 0;

        // Fetch previous day OHLC for all stocks in parallel
        const ohlcPromises = stocks.map(async (stock) => {
            if (!stock.dhanSecurityId) {
                console.warn(`⚠️ No Dhan Security ID for ${stock.symbol}`);
                failCount++;
                return stock;
            }

            try {
                const prevDayData = await this.dhanClient.getPreviousDayOHLC(
                    stock.dhanSecurityId,
                    'NSE_EQ'
                );

                if (!prevDayData) {
                    // No previous day data available, return stock as-is
                    console.warn(`⚠️ No previous day data for ${stock.symbol}`);
                    failCount++;
                    return stock;
                }

                // Determine breakout type
                const isBreakout = stock.ltp > prevDayData.high;
                const isBreakdown = stock.ltp < prevDayData.low;
                const breakoutType: 'BREAKOUT' | 'BREAKDOWN' | null = isBreakout ? 'BREAKOUT' : isBreakdown ? 'BREAKDOWN' : null;

                console.log(`✅ ${stock.symbol}: High=${prevDayData.high}, Low=${prevDayData.low}, LTP=${stock.ltp}, Type=${breakoutType || 'RANGE'}`);
                successCount++;

                return {
                    ...stock,
                    previousDayHigh: prevDayData.high,
                    previousDayLow: prevDayData.low,
                    previousDayOpen: prevDayData.open,
                    breakoutType,
                };
            } catch (error) {
                console.error(`❌ Error fetching previous day OHLC for ${stock.symbol}:`, error);
                failCount++;
                return stock; // Return stock without enrichment on error
            }
        });

        // Wait for all to complete (Promise.allSettled to handle failures gracefully)
        const results = await Promise.allSettled(ohlcPromises);

        console.log(`📈 OHLC Enrichment Complete: ${successCount} success, ${failCount} failed out of ${stocks.length} stocks`);

        return results.map(result =>
            result.status === 'fulfilled' ? result.value : stocks.find(s => true)!
        );
    }

    /**
     * Check if stock is in breakout (price > previous day high)
     */
    private isBreakout(stock: StockData): boolean {
        if (!stock.previousDayHigh) return false;
        return stock.ltp > stock.previousDayHigh;
    }

    /**
     * Check if stock is in breakdown (price < previous day low)
     */
    private isBreakdown(stock: StockData): boolean {
        if (!stock.previousDayLow) return false;
        return stock.ltp < stock.previousDayLow;
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

        const foSymbols = new Set(foList.map((f: any) => f.symbol));

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
