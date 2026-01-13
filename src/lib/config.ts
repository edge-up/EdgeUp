/**
 * EdgeUp Configuration
 * Centralized config for all configurable values
 * All values can be overridden via environment variables
 */

// ================================
// HELPER: Parse time string to minutes
// ================================

/**
 * Convert time string "HH:MM" to minutes from midnight
 * Example: "09:15" -> 555 (9*60 + 15)
 */
function parseTimeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// ================================
// MARKET TIMING CONFIG
// ================================

/** Analysis window start time (default: 9:15 AM IST) */
export const ANALYSIS_START_TIME = process.env.NEXT_PUBLIC_ANALYSIS_START_TIME || '09:15';
export const ANALYSIS_START_MINUTES = parseTimeToMinutes(ANALYSIS_START_TIME);

/** Analysis window end time (default: 9:25 AM IST) */
export const ANALYSIS_END_TIME = process.env.NEXT_PUBLIC_ANALYSIS_END_TIME || '09:25';
export const ANALYSIS_END_MINUTES = parseTimeToMinutes(ANALYSIS_END_TIME);

/** Dashboard refresh interval in milliseconds (default: 30 seconds) */
export const REFRESH_INTERVAL_MS = parseInt(
    process.env.NEXT_PUBLIC_REFRESH_INTERVAL_MS || '30000',
    10
);

// ================================
// FILTER THRESHOLDS
// ================================

/** Minimum price change % to qualify (default: 1%) */
export const PRICE_CHANGE_THRESHOLD = parseFloat(
    process.env.NEXT_PUBLIC_PRICE_CHANGE_THRESHOLD || '1'
);

/** Minimum OI change % to qualify (default: 7%) */
export const OI_CHANGE_THRESHOLD = parseFloat(
    process.env.NEXT_PUBLIC_OI_CHANGE_THRESHOLD || '7'
);

// ================================
// HELPER FUNCTIONS
// ================================

/**
 * Check if current time is within the analysis window
 * Uses IST timezone
 */
export function isWithinAnalysisWindow(): boolean {
    const now = new Date();
    const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const currentMinutes = istTime.getHours() * 60 + istTime.getMinutes();

    return currentMinutes >= ANALYSIS_START_MINUTES && currentMinutes <= ANALYSIS_END_MINUTES;
}

/**
 * Get analysis window times in human readable format
 */
export function getAnalysisWindowString(): string {
    return `${ANALYSIS_START_TIME} - ${ANALYSIS_END_TIME} IST`;
}

/**
 * Get time remaining in analysis window (in seconds)
 * Returns 0 if not in window
 */
export function getTimeRemainingInWindow(): number {
    if (!isWithinAnalysisWindow()) return 0;

    const now = new Date();
    const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const currentMinutes = istTime.getHours() * 60 + istTime.getMinutes();
    const currentSeconds = istTime.getSeconds();

    const remainingMinutes = ANALYSIS_END_MINUTES - currentMinutes;
    const remainingSeconds = remainingMinutes * 60 - currentSeconds;

    return Math.max(0, remainingSeconds);
}

// ================================
// CONFIG EXPORT FOR DEBUGGING
// ================================

export const CONFIG = {
    market: {
        analysisStartTime: ANALYSIS_START_TIME,
        analysisEndTime: ANALYSIS_END_TIME,
        refreshIntervalMs: REFRESH_INTERVAL_MS,
    },
    filters: {
        priceChangeThreshold: PRICE_CHANGE_THRESHOLD,
        oiChangeThreshold: OI_CHANGE_THRESHOLD,
    },
};

export default CONFIG;
