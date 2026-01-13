'use client';

import { useEffect, useState, useCallback } from 'react';
import { SectorCard } from '@/components/dashboard/SectorCard';
import { SnapshotStatus } from '@/components/dashboard/SnapshotStatus';
import { SectorData } from '@/types';
import {
    REFRESH_INTERVAL_MS,
    isWithinAnalysisWindow,
    getAnalysisWindowString,
    getTimeRemainingInWindow
} from '@/lib/config';

interface SectorsResponse {
    success: boolean;
    data: {
        sectors: SectorData[];
        snapshotTime: string | null;
        isFrozen: boolean;
        tradingDate?: string;
        summary?: {
            totalSectors: number;
            totalStocks: number;
            bullishSectors: number;
            bearishSectors: number;
        };
        timestamp?: string;
        message?: string;
    };
    error?: string;
}

export default function DashboardClient() {
    const [data, setData] = useState<SectorsResponse['data'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLiveWindow, setIsLiveWindow] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/sectors');
            const json: SectorsResponse = await res.json();

            if (!json.success) {
                throw new Error('Failed to fetch sectors');
            }

            setData(json.data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();

        // Update live window status every second
        const windowCheck = setInterval(() => {
            setIsLiveWindow(isWithinAnalysisWindow());
            setTimeRemaining(getTimeRemainingInWindow());
        }, 1000);

        // Auto-refresh during live window using configurable interval
        const refreshInterval = setInterval(() => {
            if (isWithinAnalysisWindow() && !data?.isFrozen) {
                fetchData();
            }
        }, REFRESH_INTERVAL_MS);

        return () => {
            clearInterval(windowCheck);
            clearInterval(refreshInterval);
        };
    }, [fetchData, data?.isFrozen]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">Loading market data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-dark rounded-2xl p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bearish-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-bearish-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Unable to Load Data</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
                <button
                    onClick={() => { setLoading(true); fetchData(); }}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    const sectors = data?.sectors || [];
    const bullishSectors = sectors.filter(s => s.direction === 'UP');
    const bearishSectors = sectors.filter(s => s.direction === 'DOWN');

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                        Market Dashboard
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        NSE sector momentum and qualifying F&amp;O stocks
                    </p>
                </div>
                <SnapshotStatus
                    isFrozen={data?.isFrozen || false}
                    snapshotTime={data?.snapshotTime}
                    tradingDate={data?.tradingDate}
                />
            </div>

            {/* Summary Stats */}
            {data?.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass-dark rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{data.summary.totalSectors}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Qualifying Sectors</p>
                    </div>
                    <div className="glass-dark rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{data.summary.totalStocks}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Qualifying Stocks</p>
                    </div>
                    <div className="glass-dark rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-bullish-500">{data.summary.bullishSectors}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Bullish Sectors</p>
                    </div>
                    <div className="glass-dark rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-bearish-500">{data.summary.bearishSectors}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Bearish Sectors</p>
                    </div>
                </div>
            )}

            {/* No Sectors Message */}
            {sectors.length === 0 && (
                <div className="space-y-4">
                    {/* Demo Mode Banner */}
                    <div className="glass-dark rounded-2xl p-6 border-2 border-primary-500/30">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                            <span className="text-4xl">🎭</span>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Want to see how it looks?</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    View the demo dashboard with sample market data to see EdgeUp in action!
                                </p>
                                <a
                                    href="/dashboard/demo"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                                >
                                    <span>🚀</span>
                                    View Demo Dashboard
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* No Data Message */}
                    <div className="glass-dark rounded-2xl p-12 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                            No Qualifying Sectors
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
                            No sectors have moved ≥1% yet. Add your Dhan API credentials to get real market data.
                        </p>
                        <p className="text-sm text-gray-400">
                            Check back during market hours (9:15 AM - 3:30 PM IST)
                        </p>
                    </div>
                </div>
            )}

            {/* Bullish Sectors */}
            {bullishSectors.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-bullish-500"></span>
                        Bullish Sectors ({bullishSectors.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bullishSectors.map(sector => (
                            <SectorCard key={sector.id} sector={sector} />
                        ))}
                    </div>
                </section>
            )}

            {/* Bearish Sectors */}
            {bearishSectors.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-bearish-500"></span>
                        Bearish Sectors ({bearishSectors.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bearishSectors.map(sector => (
                            <SectorCard key={sector.id} sector={sector} />
                        ))}
                    </div>
                </section>
            )}

            {/* Footer Note */}
            {!data?.isFrozen && sectors.length > 0 && (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                    Data refreshes every 30 seconds • Last updated: {data?.timestamp}
                </p>
            )}
        </div>
    );
}
