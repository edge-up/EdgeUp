'use client';

import { useEffect, useState, useCallback } from 'react';
import { SectorCard } from '@/components/dashboard/SectorCard';
import { DashboardSkeleton } from '@/components/ui/LoadingSkeleton';
import { SectorData } from '@/types';

interface LiveSectorsResponse {
    success: boolean;
    data: {
        sectors: SectorData[];
        allSectors: SectorData[];
        isLiveMode: boolean;
        timestamp: string;
        summary: {
            totalSectors: number;
            totalStocks: number;
            bullishSectors: number;
            bearishSectors: number;
        };
    };
    error?: string;
}

const REFRESH_INTERVAL_SECONDS = 30;

export default function LiveDashboardClient() {
    const [data, setData] = useState<LiveSectorsResponse['data'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(REFRESH_INTERVAL_SECONDS);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = useCallback(async (showRefreshing = false) => {
        try {
            if (showRefreshing) setIsRefreshing(true);

            const res = await fetch('/api/sectors/live');
            const json: LiveSectorsResponse = await res.json();

            if (!json.success) {
                throw new Error(json.error || 'Failed to fetch live data');
            }

            setData(json.data);
            setError(null);
            setLastRefresh(new Date());
            setCountdown(REFRESH_INTERVAL_SECONDS);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();

        // Countdown timer
        const countdownInterval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    fetchData(true);
                    return REFRESH_INTERVAL_SECONDS;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(countdownInterval);
        };
    }, [fetchData]);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });
    };

    if (loading) {
        return <DashboardSkeleton />;
    }

    if (error) {
        return (
            <div className="glass-card rounded-2xl p-10 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-500/15 flex items-center justify-center">
                    <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Unable to Load Live Data</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
                <button
                    onClick={() => { setLoading(true); fetchData(); }}
                    className="btn-primary"
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
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        Live Market Monitor
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Real-time sector momentum • Auto-refreshes every {REFRESH_INTERVAL_SECONDS}s
                    </p>
                </div>

                {/* Live Status Badge */}
                <div className="flex items-center gap-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>
                            {isRefreshing ? 'Refreshing...' : `Next in ${countdown}s`}
                        </span>
                    </div>
                    <button
                        onClick={() => fetchData(true)}
                        disabled={isRefreshing}
                        className="btn-primary !py-2.5 flex items-center gap-2"
                    >
                        <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            {data?.summary && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="glass-card rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="stat-icon-primary">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white font-data">{data.summary.totalSectors}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Sectors</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="stat-icon-neutral">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white font-data">{data.summary.totalStocks}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Stocks</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="stat-icon-bullish">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-emerald-500 font-data">{data.summary.bullishSectors}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Bullish</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="stat-icon-bearish">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-rose-500 font-data">{data.summary.bearishSectors}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Bearish</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* No Sectors Message */}
            {sectors.length === 0 && (
                <div className="glass-card rounded-2xl p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                        No Qualifying Sectors (Live)
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
                        No sectors have moved ≥1% yet. Data will update automatically.
                    </p>
                    <p className="text-sm text-slate-400 dark:text-slate-500">
                        Market hours: 9:15 AM - 3:30 PM IST
                    </p>
                </div>
            )}

            {/* Bullish Sectors */}
            {bullishSectors.length > 0 && (
                <section className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                        Bullish Sectors
                        <span className="text-sm font-normal text-slate-500 dark:text-slate-400">({bullishSectors.length})</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bullishSectors.map((sector, index) => (
                            <div key={sector.id} className="animate-fade-in-up" style={{ animationDelay: `${(index + 1) * 50}ms` }}>
                                <SectorCard sector={sector} basePath="/dashboard/live" />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Bearish Sectors */}
            {bearishSectors.length > 0 && (
                <section className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                        Bearish Sectors
                        <span className="text-sm font-normal text-slate-500 dark:text-slate-400">({bearishSectors.length})</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bearishSectors.map((sector, index) => (
                            <div key={sector.id} className="animate-fade-in-up" style={{ animationDelay: `${(index + 1) * 50}ms` }}>
                                <SectorCard sector={sector} basePath="/dashboard/live" />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Footer Note */}
            {lastRefresh && (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                    Last updated: {formatTime(lastRefresh)} • Auto-refreshing every {REFRESH_INTERVAL_SECONDS} seconds
                </p>
            )}
        </div>
    );
}
