// Type definitions for EdgeUp application

// ================================
// DHAN API TYPES
// ================================

export interface DhanQuote {
    securityId: string;
    ltp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    previousClose: number;
    change: number;
    changePercent: number;
    lastTradeTime: number;
    openInterest?: number;
}

export interface DhanLTP {
    securityId: string;
    ltp: number;
}

export interface DhanInstrument {
    securityId: string;
    exchangeSegment: string;
    instrumentType: string;
    tradingSymbol: string;
    name: string;
    lotSize?: number;
    tickSize?: number;
    expiry?: string;
}

export interface DhanHistoricalData {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    timestamp: string;
}

// ================================
// APPLICATION TYPES
// ================================

export type Direction = 'UP' | 'DOWN' | 'NEUTRAL';

export interface SectorData {
    id: string;
    name: string;
    symbol: string;
    dhanSecurityId: string | null;
    currentValue: number;
    previousClose: number;
    percentChange: number;
    direction: Direction;
    qualifyingStockCount: number;
    isQualifying: boolean;
}

export interface StockData {
    id: string;
    symbol: string;
    name: string;
    sectorId: string;
    sectorName: string;
    dhanSecurityId: string | null;
    ltp: number;
    previousClose: number;
    percentChange: number;
    direction: Direction;
    isFOEligible: boolean;
    isQualifying: boolean;
    volume?: number;
    open?: number;
    high?: number;
    low?: number;
    openInterest?: number;
    previousOpenInterest?: number;
    oiChangePercent?: number;  // (current - prev) / prev * 100
    // Previous day OHLC for breakout detection
    previousDayHigh?: number;
    previousDayLow?: number;
    previousDayOpen?: number;
    breakoutType?: 'BREAKOUT' | 'BREAKDOWN' | null;
}

export interface SnapshotData {
    id: string;
    tradingDate: string;
    snapshotTime: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    totalSectors: number;
    totalStocks: number;
    bullishSectors: number;
    bearishSectors: number;
    sectors: SectorData[];
}

export interface SnapshotSummary {
    id: string;
    tradingDate: string;
    snapshotTime: string;
    totalQualifyingSectors: number;
    totalQualifyingStocks: number;
    bullishSectors: number;
    bearishSectors: number;
    isFrozen: boolean;
}

// ================================
// API RESPONSE TYPES
// ================================

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface SectorsResponse {
    sectors: SectorData[];
    snapshotTime: string | null;
    isFrozen: boolean;
}

export interface SectorStocksResponse {
    sector: SectorData;
    stocks: StockData[];
    snapshotTime: string | null;
    isFrozen: boolean;
}

export interface LatestSnapshotResponse {
    snapshot: SnapshotData | null;
    isFrozen: boolean;
    nextUpdateAt: string | null;
}

export interface LiveDataResponse {
    sectors: SectorData[];
    timestamp: string;
    isMarketOpen: boolean;
    nextSnapshotAt: string;
}

// ================================
// CONFIG TYPES
// ================================

export interface MarketConfig {
    snapshotTime: { hour: number; minute: number }; // 09:25 IST
    marketOpenTime: { hour: number; minute: number }; // 09:15 IST
    marketCloseTime: { hour: number; minute: number }; // 15:30 IST
    timezone: string; // "Asia/Kolkata"
    qualifyingThreshold: number; // 1.0 (±1%)
}

export const DEFAULT_MARKET_CONFIG: MarketConfig = {
    snapshotTime: { hour: 9, minute: 25 },
    marketOpenTime: { hour: 9, minute: 15 },
    marketCloseTime: { hour: 15, minute: 30 },
    timezone: 'Asia/Kolkata',
    qualifyingThreshold: 1.0,
};

// ================================
// NSE SECTOR DEFINITIONS
// ================================

export interface SectorDefinition {
    name: string;
    symbol: string;
    nseIndexSymbol: string;
    description: string;
}

export const NSE_SECTORS: SectorDefinition[] = [
    { name: 'NIFTY BANK', symbol: 'NIFTY_BANK', nseIndexSymbol: 'NIFTY BANK', description: 'Banking sector index' },
    { name: 'NIFTY IT', symbol: 'NIFTY_IT', nseIndexSymbol: 'NIFTY IT', description: 'Information Technology sector' },
    { name: 'NIFTY FINANCIAL SERVICES', symbol: 'NIFTY_FIN_SERVICE', nseIndexSymbol: 'NIFTY FINANCIAL SERVICES', description: 'Financial services sector' },
    { name: 'NIFTY AUTO', symbol: 'NIFTY_AUTO', nseIndexSymbol: 'NIFTY AUTO', description: 'Automobile sector' },
    { name: 'NIFTY PHARMA', symbol: 'NIFTY_PHARMA', nseIndexSymbol: 'NIFTY PHARMA', description: 'Pharmaceutical sector' },
    { name: 'NIFTY METAL', symbol: 'NIFTY_METAL', nseIndexSymbol: 'NIFTY METAL', description: 'Metal & Mining sector' },
    { name: 'NIFTY REALTY', symbol: 'NIFTY_REALTY', nseIndexSymbol: 'NIFTY REALTY', description: 'Real Estate sector' },
    { name: 'NIFTY ENERGY', symbol: 'NIFTY_ENERGY', nseIndexSymbol: 'NIFTY ENERGY', description: 'Energy sector' },
    { name: 'NIFTY FMCG', symbol: 'NIFTY_FMCG', nseIndexSymbol: 'NIFTY FMCG', description: 'Fast Moving Consumer Goods' },
    { name: 'NIFTY MEDIA', symbol: 'NIFTY_MEDIA', nseIndexSymbol: 'NIFTY MEDIA', description: 'Media & Entertainment' },
    { name: 'NIFTY PSU BANK', symbol: 'NIFTY_PSU_BANK', nseIndexSymbol: 'NIFTY PSU BANK', description: 'Public Sector Banks' },
    { name: 'NIFTY PRIVATE BANK', symbol: 'NIFTY_PVT_BANK', nseIndexSymbol: 'NIFTY PRIVATE BANK', description: 'Private Sector Banks' },
    { name: 'NIFTY COMMODITIES', symbol: 'NIFTY_COMMODITIES', nseIndexSymbol: 'NIFTY COMMODITIES', description: 'Commodities sector' },
    { name: 'NIFTY INFRASTRUCTURE', symbol: 'NIFTY_INFRA', nseIndexSymbol: 'NIFTY INFRASTRUCTURE', description: 'Infrastructure sector' },
    { name: 'NIFTY CONSUMER DURABLES', symbol: 'NIFTY_CONSUMER_DURABLES', nseIndexSymbol: 'NIFTY CONSUMER DURABLES', description: 'Consumer Durables' },
    { name: 'NIFTY OIL & GAS', symbol: 'NIFTY_OIL_GAS', nseIndexSymbol: 'NIFTY OIL & GAS', description: 'Oil & Gas sector' },
    { name: 'NIFTY HEALTHCARE', symbol: 'NIFTY_HEALTHCARE', nseIndexSymbol: 'NIFTY HEALTHCARE INDEX', description: 'Healthcare sector' },
];
