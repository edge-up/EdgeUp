import { DEFAULT_MARKET_CONFIG, MarketConfig } from '@/types';

/**
 * Utility functions for market time calculations
 * All times are in IST (Asia/Kolkata)
 */

const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Get current time in IST
 */
export function getCurrentIST(): Date {
    return new Date(new Date().toLocaleString('en-US', { timeZone: IST_TIMEZONE }));
}

/**
 * Get current date at midnight IST (for trading date)
 */
export function getTradingDate(): Date {
    const now = getCurrentIST();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Check if current time is before snapshot time (09:25 AM IST)
 */
export function isBeforeSnapshotTime(config: MarketConfig = DEFAULT_MARKET_CONFIG): boolean {
    const now = getCurrentIST();
    const snapshotTime = new Date(now);
    snapshotTime.setHours(config.snapshotTime.hour, config.snapshotTime.minute, 0, 0);
    return now < snapshotTime;
}

/**
 * Check if current time is after snapshot time (09:25 AM IST)
 */
export function isAfterSnapshotTime(config: MarketConfig = DEFAULT_MARKET_CONFIG): boolean {
    return !isBeforeSnapshotTime(config);
}

/**
 * Check if market is currently open
 * Market hours: 09:15 AM - 03:30 PM IST
 */
export function isMarketOpen(config: MarketConfig = DEFAULT_MARKET_CONFIG): boolean {
    const now = getCurrentIST();
    const day = now.getDay();

    // Weekend check (0 = Sunday, 6 = Saturday)
    if (day === 0 || day === 6) {
        return false;
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = config.marketOpenTime.hour * 60 + config.marketOpenTime.minute;
    const closeMinutes = config.marketCloseTime.hour * 60 + config.marketCloseTime.minute;

    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}

/**
 * Check if we're in the analysis window (09:15 - 09:25 AM IST)
 */
export function isInAnalysisWindow(config: MarketConfig = DEFAULT_MARKET_CONFIG): boolean {
    const now = getCurrentIST();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = config.marketOpenTime.hour * 60 + config.marketOpenTime.minute;
    const snapshotMinutes = config.snapshotTime.hour * 60 + config.snapshotTime.minute;

    return currentMinutes >= openMinutes && currentMinutes < snapshotMinutes;
}

/**
 * Get the next snapshot time
 */
export function getNextSnapshotTime(config: MarketConfig = DEFAULT_MARKET_CONFIG): Date {
    const now = getCurrentIST();
    const snapshotTime = new Date(now);
    snapshotTime.setHours(config.snapshotTime.hour, config.snapshotTime.minute, 0, 0);

    // If past snapshot time today, set to tomorrow
    if (now >= snapshotTime) {
        snapshotTime.setDate(snapshotTime.getDate() + 1);
    }

    // Skip weekends
    let day = snapshotTime.getDay();
    while (day === 0 || day === 6) {
        snapshotTime.setDate(snapshotTime.getDate() + 1);
        day = snapshotTime.getDay();
    }

    return snapshotTime;
}

/**
 * Get previous trading day
 */
export function getPreviousTradingDay(): Date {
    const today = getTradingDate();
    const prevDay = new Date(today);
    prevDay.setDate(prevDay.getDate() - 1);

    // Skip weekends
    let day = prevDay.getDay();
    while (day === 0 || day === 6) {
        prevDay.setDate(prevDay.getDate() - 1);
        day = prevDay.getDay();
    }

    return prevDay;
}

/**
 * Format date for display (IST)
 */
export function formatDateIST(date: Date): string {
    return date.toLocaleDateString('en-IN', {
        timeZone: IST_TIMEZONE,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

/**
 * Format time for display (IST)
 */
export function formatTimeIST(date: Date): string {
    return date.toLocaleTimeString('en-IN', {
        timeZone: IST_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });
}

/**
 * Format datetime for display (IST)
 */
export function formatDateTimeIST(date: Date): string {
    return `${formatDateIST(date)} ${formatTimeIST(date)}`;
}

/**
 * Calculate percent change
 */
export function calculatePercentChange(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
}

/**
 * Check if percent change meets qualifying threshold
 */
export function isQualifying(percentChange: number, threshold: number = DEFAULT_MARKET_CONFIG.qualifyingThreshold): boolean {
    return Math.abs(percentChange) >= threshold;
}

/**
 * Get direction from percent change
 */
export function getDirection(percentChange: number): 'UP' | 'DOWN' | 'NEUTRAL' {
    if (percentChange > 0) return 'UP';
    if (percentChange < 0) return 'DOWN';
    return 'NEUTRAL';
}
