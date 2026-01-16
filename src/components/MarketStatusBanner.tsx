'use client';

import { useEffect, useState } from 'react';

interface MarketStatus {
    isOpen: boolean;
    isTradingDay: boolean;
    reason?: string;
    nextOpen?: string;
}

/**
 * Market Status Banner
 * Shows a prominent banner when market is closed (weekend, holiday, or outside trading hours)
 */
export function MarketStatusBanner() {
    const [status, setStatus] = useState<MarketStatus | null>(null);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch('/api/market-status');
                const data = await res.json();
                setStatus(data);
            } catch (error) {
                console.error('Failed to fetch market status:', error);
            }
        };

        // Fetch immediately
        fetchStatus();

        // Update every minute
        const interval = setInterval(fetchStatus, 60000);

        return () => clearInterval(interval);
    }, []);

    // Don't show banner if market is open
    if (!status || status.isOpen) {
        return null;
    }

    return (
        <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-500/20 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                            <span className="text-2xl" role="img" aria-label="calendar">
                                📅
                            </span>
                        </div>
                        <div>
                            <p className="font-semibold text-amber-900 dark:text-amber-100">
                                Market Closed
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-200">
                                {status.reason}
                                {status.nextOpen && ` • Opens ${status.nextOpen}`}
                            </p>
                        </div>
                    </div>

                    {!status.isTradingDay && (
                        <div className="hidden sm:block">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-800 dark:text-amber-200">
                                Non-Trading Day
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
