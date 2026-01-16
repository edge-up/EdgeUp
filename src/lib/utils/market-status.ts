import prisma from '@/lib/db/prisma';
import { getCurrentIST } from './market-time';

export interface MarketStatus {
    isOpen: boolean;
    isTradingDay: boolean;
    reason?: string;
    nextTradingDay?: Date;
    currentSessionType?: 'NORMAL' | 'MUHURAT' | 'HALF_DAY' | 'CLOSED';
}

/**
 * Check if a given date is a trading day
 * Checks against weekends and holiday calendar
 */
export async function isTradingDay(date: Date = new Date()): Promise<boolean> {
    // Check weekend (Saturday = 6, Sunday = 0)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return false;
    }

    // Check holiday calendar
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    try {
        const holiday = await prisma.tradingCalendar.findUnique({
            where: { date: startOfDay },
        });

        // If holiday exists and isHoliday is true, it's not a trading day
        return !holiday?.isHoliday;
    } catch (error) {
        console.error('Error checking trading calendar:', error);
        // Fallback: assume it's a trading day if DB check fails
        return true;
    }
}

/**
 * Get the previous trading day
 * Useful for fetching previous day's OHLC data
 */
export async function getPreviousTradingDay(from: Date = new Date()): Promise<Date | null> {
    const checkDate = new Date(from);

    // Look back up to 14 days to find a trading day
    for (let i = 1; i <= 14; i++) {
        checkDate.setDate(from.getDate() - i);

        const isTrading = await isTradingDay(checkDate);
        if (isTrading) {
            return checkDate;
        }
    }

    // No trading day found in the past 14 days (unlikely)
    return null;
}

/**
 * Get the next trading day
 * Useful for displaying "Next trading day: ..."
 */
export async function getNextTradingDay(from: Date = new Date()): Promise<Date | null> {
    const checkDate = new Date(from);

    // Look ahead up to 14 days
    for (let i = 1; i <= 14; i++) {
        checkDate.setDate(from.getDate() + i);

        const isTrading = await isTradingDay(checkDate);
        if (isTrading) {
            return checkDate;
        }
    }

    return null;
}

/**
 * Get comprehensive market status
 * Checks if market is open, if it's a trading day, and provides context
 */
export async function getMarketStatus(): Promise<MarketStatus> {
    const now = getCurrentIST();
    const dayOfWeek = now.getDay();

    // Weekend check
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        const nextDay = await getNextTradingDay(now);
        return {
            isOpen: false,
            isTradingDay: false,
            reason: dayOfWeek === 0 ? 'Sunday' : 'Saturday',
            nextTradingDay: nextDay || undefined,
            currentSessionType: 'CLOSED',
        };
    }

    // Holiday check
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    try {
        const holiday = await prisma.tradingCalendar.findUnique({
            where: { date: startOfDay },
        });

        if (holiday?.isHoliday) {
            const nextDay = await getNextTradingDay(now);
            return {
                isOpen: false,
                isTradingDay: false,
                reason: holiday.holidayName || 'Market Holiday',
                nextTradingDay: nextDay || undefined,
                currentSessionType: holiday.sessionType as any,
            };
        }
    } catch (error) {
        console.error('Error checking holiday calendar:', error);
    }

    // Market hours check (9:15 AM - 3:30 PM IST)
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentMinutes = hours * 60 + minutes;

    const preMarketStart = 9 * 60; // 9:00 AM
    const marketOpen = 9 * 60 + 15; // 9:15 AM
    const marketClose = 15 * 60 + 30; // 3:30 PM

    if (currentMinutes < preMarketStart) {
        return {
            isOpen: false,
            isTradingDay: true,
            reason: 'Pre-market (Market opens at 9:15 AM)',
            currentSessionType: 'NORMAL',
        };
    }

    if (currentMinutes >= marketClose) {
        const nextDay = await getNextTradingDay(now);
        return {
            isOpen: false,
            isTradingDay: true,
            reason: 'Post-market (Market closed at 3:30 PM)',
            nextTradingDay: nextDay || undefined,
            currentSessionType: 'CLOSED',
        };
    }

    // Market is open!
    return {
        isOpen: true,
        isTradingDay: true,
        currentSessionType: 'NORMAL',
    };
}

/**
 * Check if we should run market analysis
 * Only run during trading hours on trading days
 */
export async function shouldRunAnalysis(): Promise<boolean> {
    const status = await getMarketStatus();
    return status.isTradingDay && status.isOpen;
}
