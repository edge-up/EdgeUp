import { DhanQuote, DhanLTP, DhanInstrument, DhanHistoricalData } from '@/types';

const DHAN_API_BASE = 'https://api.dhan.co/v2';

// Rate limiting: Quote APIs allow only 1 request per second
const QUOTE_API_RATE_LIMIT_MS = 1100; // 1.1 seconds to be safe
let lastQuoteApiCallTime = 0;

async function waitForQuoteRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - lastQuoteApiCallTime;
    if (timeSinceLastCall < QUOTE_API_RATE_LIMIT_MS) {
        const waitTime = QUOTE_API_RATE_LIMIT_MS - timeSinceLastCall;
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    lastQuoteApiCallTime = Date.now();
}

interface DhanClientConfig {
    clientId: string;
    accessToken: string;
}

/**
 * Dhan API Client for fetching market data
 * Documentation: https://dhanhq.co/docs/v2/
 * Rate Limits: Quote APIs = 1 request/second
 */
export class DhanClient {
    private clientId: string;
    private accessToken: string;

    constructor(config?: DhanClientConfig) {
        this.clientId = config?.clientId || process.env.DHAN_CLIENT_ID || '';
        this.accessToken = config?.accessToken || process.env.DHAN_ACCESS_TOKEN || '';

        if (!this.clientId || !this.accessToken) {
            console.warn('DhanClient: Missing credentials. Some features may not work.');
        }
    }

    private get headers(): HeadersInit {
        return {
            'Content-Type': 'application/json',
            'access-token': this.accessToken,
            'client-id': this.clientId,
        };
    }

    /**
     * Fetch Last Traded Price for multiple securities
     * @param securityIds Array of Dhan security IDs
     * @returns Array of LTP data
     */
    async getLTP(securityIds: string[]): Promise<DhanLTP[]> {
        try {
            // Dhan API accepts up to 1000 instruments per request
            const chunks = this.chunkArray(securityIds, 1000);
            const results: DhanLTP[] = [];

            for (const chunk of chunks) {
                const payload = {
                    NSE_EQ: chunk.filter(id => id.startsWith('NSE_EQ_')).map(id => id.replace('NSE_EQ_', '')),
                    NSE_FNO: chunk.filter(id => id.startsWith('NSE_FNO_')).map(id => id.replace('NSE_FNO_', '')),
                    IDX_I: chunk.filter(id => id.startsWith('IDX_')).map(id => id.replace('IDX_', '')),
                };

                const response = await fetch(`${DHAN_API_BASE}/marketfeed/ltp`, {
                    method: 'POST',
                    headers: this.headers,
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(`Dhan API Error: ${error.errorMessage || response.statusText}`);
                }

                const data = await response.json();
                results.push(...this.parseLTPResponse(data));
            }

            return results;
        } catch (error) {
            console.error('DhanClient.getLTP error:', error);
            throw error;
        }
    }

    /**
     * Fetch full quote data for multiple securities
     * @param securityIds Array of Dhan security IDs
     * @returns Array of quote data
     */
    async getQuotes(securityIds: string[]): Promise<DhanQuote[]> {
        try {
            const chunks = this.chunkArray(securityIds, 1000);
            const results: DhanQuote[] = [];

            for (const chunk of chunks) {
                const payload = this.buildSecurityPayload(chunk);

                // Enforce rate limit: 1 request per second for Quote APIs
                await waitForQuoteRateLimit();

                const response = await fetch(`${DHAN_API_BASE}/marketfeed/quote`, {
                    method: 'POST',
                    headers: this.headers,
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(`Dhan API Error: ${error.errorMessage || response.statusText}`);
                }

                const data = await response.json();
                results.push(...this.parseQuoteResponse(data));
            }

            return results;
        } catch (error) {
            console.error('DhanClient.getQuotes error:', error);
            throw error;
        }
    }

    /**
     * Fetch OHLC data for multiple securities
     * @param securityIds Array of Dhan security IDs
     * @returns Array of OHLC data
     */
    async getOHLC(securityIds: string[]): Promise<DhanQuote[]> {
        try {
            const chunks = this.chunkArray(securityIds, 1000);
            const results: DhanQuote[] = [];

            for (const chunk of chunks) {
                const payload = this.buildSecurityPayload(chunk);

                const response = await fetch(`${DHAN_API_BASE}/marketfeed/ohlc`, {
                    method: 'POST',
                    headers: this.headers,
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(`Dhan API Error: ${error.errorMessage || response.statusText}`);
                }

                const data = await response.json();
                results.push(...this.parseOHLCResponse(data));
            }

            return results;
        } catch (error) {
            console.error('DhanClient.getOHLC error:', error);
            throw error;
        }
    }

    /**
     * Fetch historical daily data for a security
     * @param securityId Dhan security ID
     * @param fromDate Start date
     * @param toDate End date
     * @returns Array of historical OHLC data
     */
    async getHistoricalData(
        securityId: string,
        fromDate: Date,
        toDate: Date,
        exchangeSegment: string = 'NSE_EQ'
    ): Promise<DhanHistoricalData[]> {
        try {
            const formatDate = (d: Date) => d.toISOString().split('T')[0];

            // Extract just the security ID (remove prefix if present)
            const cleanSecurityId = securityId.replace(/^(NSE_EQ_|NSE_FNO_|IDX_)/, '');

            // Determine exchange segment (NSE for equity, NFO for futures)
            const exchange = exchangeSegment.startsWith('NSE_FNO') ? 'NFO' : 'NSE';

            const requestBody = {
                securityId: cleanSecurityId,
                exchangeSegment: exchange,
                instrument: 'EQUITY',
                expiryCode: 0,
                fromDate: formatDate(fromDate),
                toDate: formatDate(toDate),
            };

            console.log('🔍 Dhan Historical API Request:', JSON.stringify(requestBody, null, 2));

            const response = await fetch(`${DHAN_API_BASE}/charts/historical`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('❌ Dhan Historical API Error Response:', error);
                throw new Error(`Dhan API Error: ${error.errorMessage || response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ Dhan Historical API Success: ${data?.length || 0} days returned`);
            return this.parseHistoricalResponse(data);
        } catch (error) {
            console.error('DhanClient.getHistoricalData error:', error);
            throw error;
        }
    }

    /**
     * Get previous trading day's OHLC for a security
     * Used for breakout/breakdown detection
     * @param securityId Dhan security ID
     * @returns Previous day's OHLC or null if not available
     */
    async getPreviousDayOHLC(
        securityId: string,
        exchangeSegment: string = 'NSE_EQ'
    ): Promise<DhanHistoricalData | null> {
        try {
            // Fetch last 14 days of data to ensure we get previous trading day
            // (accounts for weekends/holidays, including long holiday periods like Diwali)
            const toDate = new Date();
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - 14); // Extended from 7 to 14 days

            const historicalData = await this.getHistoricalData(
                securityId,
                fromDate,
                toDate,
                exchangeSegment
            );

            if (!historicalData || historicalData.length < 2) {
                // Need at least 2 days of data (today + previous)
                console.warn(`getPreviousDayOHLC: Insufficient data for ${securityId} (got ${historicalData?.length || 0} days, need 2)`);
                return null;
            }

            // Sort by timestamp descending (most recent first)
            historicalData.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            // Return second most recent (previous trading day)
            // Index 0 = today/most recent, Index 1 = previous trading day
            const previousDay = historicalData[1];

            if (!previousDay) {
                console.warn(`getPreviousDayOHLC: No previous day data found for ${securityId}`);
                return null;
            }

            return previousDay;
        } catch (error) {
            console.error(`DhanClient.getPreviousDayOHLC error for ${securityId}:`, error);
            return null; // Return null on error, don't fail entire stock processing
        }
    }

    /**
     * Search for instruments by symbol
     * @param query Search query
     * @returns Array of matching instruments
     */
    async searchInstruments(query: string): Promise<DhanInstrument[]> {
        try {
            const response = await fetch(
                `${DHAN_API_BASE}/scrip/search?query=${encodeURIComponent(query)}`,
                {
                    method: 'GET',
                    headers: this.headers,
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Dhan API Error: ${error.errorMessage || response.statusText}`);
            }

            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('DhanClient.searchInstruments error:', error);
            throw error;
        }
    }

    // ================================
    // HELPER METHODS
    // ================================

    private buildSecurityPayload(securityIds: string[]): Record<string, number[]> {
        const payload: Record<string, number[]> = {};

        securityIds.forEach(id => {
            let cleanId = id;
            let category = 'NSE_EQ';

            if (id.startsWith('NSE_EQ_')) {
                category = 'NSE_EQ';
                cleanId = id.replace('NSE_EQ_', '');
            } else if (id.startsWith('NSE_FNO_')) {
                category = 'NSE_FNO';
                cleanId = id.replace('NSE_FNO_', '');
            } else if (id.startsWith('IDX_I_')) {
                category = 'IDX_I';
                cleanId = id.replace('IDX_I_', '');
            } else if (id.startsWith('IDX_')) {
                category = 'IDX_I';
                cleanId = id.replace('IDX_', '');
            } else {
                // Default
                category = 'NSE_EQ';
            }

            if (!payload[category]) payload[category] = [];
            payload[category].push(parseInt(cleanId, 10));
        });

        return payload;
    }

    private parseLTPResponse(data: Record<string, unknown>): DhanLTP[] {
        const results: DhanLTP[] = [];

        // Parse different exchange segments
        if (data.data && typeof data.data === 'object') {
            const segments = data.data as Record<string, Record<string, { last_price: number }>>;

            Object.entries(segments).forEach(([segment, securities]) => {
                Object.entries(securities).forEach(([secId, info]) => {
                    results.push({
                        securityId: `${segment}_${secId}`,
                        ltp: info.last_price,
                    });
                });
            });
        }

        return results;
    }

    private parseQuoteResponse(data: Record<string, unknown>): DhanQuote[] {
        const results: DhanQuote[] = [];

        if (data.data && typeof data.data === 'object') {
            const segments = data.data as Record<string, Record<string, {
                last_price: number;
                open: number;
                high: number;
                low: number;
                close: number;
                volume: number;
                prev_close?: number;
                last_trade_time?: number;
            }>>;

            Object.entries(segments).forEach(([segment, securities]) => {
                Object.entries(securities).forEach(([secId, info]) => {
                    // Handle both direct close and ohlc.close formats
                    const rawInfo = info as any;
                    const ohlc = rawInfo.ohlc || {};
                    const closePrice = ohlc.close || rawInfo.close || 0;
                    const prevClose = rawInfo.prev_close || closePrice;
                    const lastPrice = rawInfo.last_price || 0;
                    const change = lastPrice - prevClose;
                    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

                    results.push({
                        securityId: `${segment}_${secId}`,
                        ltp: lastPrice,
                        open: ohlc.open || rawInfo.open || 0,
                        high: ohlc.high || rawInfo.high || 0,
                        low: ohlc.low || rawInfo.low || 0,
                        close: closePrice,
                        volume: rawInfo.volume || 0,
                        previousClose: prevClose,
                        change,
                        changePercent,
                        lastTradeTime: rawInfo.last_trade_time || Date.now(),
                        openInterest: rawInfo.oi || 0,
                    });
                });
            });
        }

        return results;
    }

    private parseOHLCResponse(data: Record<string, unknown>): DhanQuote[] {
        // OHLC response format is similar to quote
        return this.parseQuoteResponse(data);
    }

    private parseHistoricalResponse(data: Record<string, unknown>): DhanHistoricalData[] {
        if (!data.data || !Array.isArray(data.data)) return [];

        return (data.data as Array<{
            open: number;
            high: number;
            low: number;
            close: number;
            volume: number;
            start_Time: string;
        }>).map(candle => ({
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume,
            timestamp: candle.start_Time,
        }));
    }

    private chunkArray<T>(array: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
}

// Singleton instance for app-wide use
let dhanClientInstance: DhanClient | null = null;

export function getDhanClient(): DhanClient {
    if (!dhanClientInstance) {
        dhanClientInstance = new DhanClient();
    }
    return dhanClientInstance;
}

export default DhanClient;
