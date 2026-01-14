'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { StockTable } from '@/components/dashboard/StockTable';
import { WatchlistTable } from '@/components/dashboard/WatchlistTable';
import { SnapshotStatus } from '@/components/dashboard/SnapshotStatus';
import { SectorData, StockData } from '@/types';

interface SectorStocksResponse {
    success: boolean;
    data: {
        sector: SectorData;
        stocks: StockData[];
        watchlistStocks?: StockData[];
        snapshotTime: string | null;
        isFrozen: boolean;
        tradingDate?: string;
        timestamp?: string;
    };
    error?: string;
}

export default function SectorDetailClient() {
    const params = useParams();
    const sectorId = params.sectorId as string;

    const [data, setData] = useState<SectorStocksResponse['data'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/sectors/${sectorId}/stocks`);
            const json: SectorStocksResponse = await res.json();

            if (!json.success) {
                throw new Error(json.error || 'Failed to fetch stocks');
            }

            setData(json.data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Refresh every 30 seconds if not frozen
        const interval = setInterval(() => {
            if (!data?.isFrozen) {
                fetchData();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [sectorId, data?.isFrozen]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">Loading stocks...</p>
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
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Unable to Load Stocks</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
                <div className="flex gap-4 justify-center">
                    <Link
                        href="/dashboard"
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors"
                    >
                        ← Back to Dashboard
                    </Link>
                    <button
                        onClick={() => { setLoading(true); fetchData(); }}
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const sector = data?.sector;
    const stocks = data?.stocks || [];
    const isUp = sector?.direction === 'UP';

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
            </Link>

            {/* Sector Header */}
            <div className="glass-dark rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                                {sector?.name}
                            </h1>
                            <span className={`
                px-3 py-1 rounded-full text-sm font-medium
                ${isUp ? 'bullish-badge' : 'bearish-badge'}
              `}>
                                {isUp ? '↑ UP' : '↓ DOWN'}
                            </span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">
                            {sector?.symbol} • {stocks.length} qualifying F&O stocks
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {/* Percent Change */}
                        <div className="text-right">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Sector Change</p>
                            <p className={`text-3xl font-bold ${isUp ? 'text-bullish-500' : 'text-bearish-500'}`}>
                                {isUp ? '+' : ''}{sector?.percentChange.toFixed(2)}%
                            </p>
                        </div>

                        {/* Snapshot Status */}
                        <SnapshotStatus
                            isFrozen={data?.isFrozen || false}
                            snapshotTime={data?.snapshotTime}
                            tradingDate={data?.tradingDate}
                        />
                    </div>
                </div>

                {/* Sector Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Index Value</p>
                        <p className="text-lg font-semibold text-gray-800 dark:text-white">
                            {sector?.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Prev Close</p>
                        <p className="text-lg font-semibold text-gray-800 dark:text-white">
                            {sector?.previousClose.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Qualifying Stocks</p>
                        <p className="text-lg font-semibold text-primary-500">{stocks.length}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Movement</p>
                        <p className={`text-lg font-semibold ${isUp ? 'text-bullish-500' : 'text-bearish-500'}`}>
                            {isUp ? '+' : ''}{((sector?.currentValue || 0) - (sector?.previousClose || 0)).toFixed(2)} pts
                        </p>
                    </div>
                </div>
            </div>

            {/* Stocks Table */}
            <StockTable stocks={stocks} sectorName={sector?.name} />

            {/* Watchlist Table - Stocks with price >= 1% but OI < 7% */}
            <WatchlistTable stocks={data?.watchlistStocks || []} />

            {/* Footer Note */}
            {!data?.isFrozen && (stocks.length > 0 || (data?.watchlistStocks?.length || 0) > 0) && (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                    Data refreshes every 30 seconds • Last updated: {data?.timestamp}
                </p>
            )}
        </div>
    );
}
