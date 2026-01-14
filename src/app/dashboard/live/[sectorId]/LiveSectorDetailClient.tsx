'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { StockTable } from '@/components/dashboard/StockTable';
import { WatchlistTable } from '@/components/dashboard/WatchlistTable';
import { SectorDetailSkeleton } from '@/components/ui/LoadingSkeleton';
import { StockData } from '@/types';

interface SectorStocksResponse {
    success: boolean;
    data: {
        sector: { id: string; name: string; symbol: string };
        stocks: StockData[];
        watchlistStocks?: StockData[];
        isLiveMode: boolean;
        timestamp: string;
    };
    error?: string;
}

const REFRESH_INTERVAL_SECONDS = 30;

export default function LiveSectorDetailClient() {
    const params = useParams();
    const sectorId = params.sectorId as string;

    const [data, setData] = useState<SectorStocksResponse['data'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(REFRESH_INTERVAL_SECONDS);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = useCallback(async (showRefreshing = false) => {
        try {
            if (showRefreshing) setIsRefreshing(true);

            const res = await fetch(`/api/sectors/live/${sectorId}/stocks`);
            const json: SectorStocksResponse = await res.json();

            if (!json.success) {
                throw new Error(json.error || 'Failed to fetch live stocks');
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
    }, [sectorId]);

    useEffect(() => {
        fetchData();

        const countdownInterval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    fetchData(true);
                    return REFRESH_INTERVAL_SECONDS;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(countdownInterval);
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
        return <SectorDetailSkeleton />;
    }

    if (error) {
        return (
            <div className="glass-card rounded-2xl p-10 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-500/15 flex items-center justify-center">
                    <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Unable to Load Live Stocks</h2>
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

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <Link
                        href="/dashboard/live"
                        className="inline-flex items-center gap-1.5 text-primary-500 hover:text-primary-600 text-sm font-medium mb-3 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Live Monitor
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        {data?.sector?.name || 'Sector'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {data?.sector?.symbol} • Live View • Auto-refreshes every {REFRESH_INTERVAL_SECONDS}s
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
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="glass-card rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="stat-icon-bullish">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-emerald-500 font-data">{data?.stocks?.length || 0}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Qualifying</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="stat-icon-neutral">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-amber-500 font-data">{data?.watchlistStocks?.length || 0}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Watchlist</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card rounded-xl p-4 col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-3">
                        <div className="stat-icon-primary">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white font-data">
                                {(data?.stocks?.length || 0) + (data?.watchlistStocks?.length || 0)}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Movers</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Qualifying Stocks */}
            <StockTable stocks={data?.stocks || []} title="Qualifying Stocks" />

            {/* Watchlist */}
            <WatchlistTable stocks={data?.watchlistStocks || []} />

            {/* Footer Note */}
            {lastRefresh && (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                    Last updated: {formatTime(lastRefresh)} • Auto-refreshing every {REFRESH_INTERVAL_SECONDS} seconds
                </p>
            )}
        </div>
    );
}
