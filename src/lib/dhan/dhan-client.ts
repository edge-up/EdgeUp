import { DhanQuote, DhanLTP, DhanInstrument, DhanHistoricalData } from '@/types';

const DHAN_API_BASE = 'https://api.dhan.co/v2';

interface DhanClientConfig {
    clientId: string;
    accessToken: string;
}

/**
 * Dhan API Client for fetching market data
 * Documentation: https://dhanhq.co/docs/v2/
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

            const response = await fetch(`${DHAN_API_BASE}/charts/historical`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    securityId: securityId.replace(/^(NSE_EQ_|NSE_FNO_|IDX_)/, ''),
                    exchangeSegment,
                    instrument: 'EQUITY',
                    expiryCode: 0,
                    fromDate: formatDate(fromDate),
                    toDate: formatDate(toDate),
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Dhan API Error: ${error.errorMessage || response.statusText}`);
            }

            const data = await response.json();
            return this.parseHistoricalResponse(data);
        } catch (error) {
            console.error('DhanClient.getHistoricalData error:', error);
            throw error;
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

    private buildSecurityPayload(securityIds: string[]): Record<string, string[]> {
        const payload: Record<string, string[]> = {};

        securityIds.forEach(id => {
            if (id.startsWith('NSE_EQ_')) {
                if (!payload.NSE_EQ) payload.NSE_EQ = [];
                payload.NSE_EQ.push(id.replace('NSE_EQ_', ''));
            } else if (id.startsWith('NSE_FNO_')) {
                if (!payload.NSE_FNO) payload.NSE_FNO = [];
                payload.NSE_FNO.push(id.replace('NSE_FNO_', ''));
            } else if (id.startsWith('IDX_')) {
                if (!payload.IDX_I) payload.IDX_I = [];
                payload.IDX_I.push(id.replace('IDX_', ''));
            } else {
                // Default to NSE_EQ
                if (!payload.NSE_EQ) payload.NSE_EQ = [];
                payload.NSE_EQ.push(id);
            }
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
                    const prevClose = info.prev_close || info.close;
                    const change = info.last_price - prevClose;
                    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

                    results.push({
                        securityId: `${segment}_${secId}`,
                        ltp: info.last_price,
                        open: info.open,
                        high: info.high,
                        low: info.low,
                        close: info.close,
                        volume: info.volume,
                        previousClose: prevClose,
                        change,
                        changePercent,
                        lastTradeTime: info.last_trade_time || Date.now(),
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
