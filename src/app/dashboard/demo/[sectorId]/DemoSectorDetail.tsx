'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { StockTable } from '@/components/dashboard/StockTable';
import { SnapshotStatus } from '@/components/dashboard/SnapshotStatus';
import { SectorDetailSkeleton } from '@/components/ui/LoadingSkeleton';
import { SectorData, StockData } from '@/types';

interface SectorStocksResponse {
    success: boolean;
    data: {
        sector: SectorData;
        stocks: StockData[];
        snapshotTime: string | null;
        isFrozen: boolean;
        tradingDate?: string;
        timestamp?: string;
    };
    error?: string;
}

export default function DemoSectorDetail() {
    const params = useParams();
    const sectorId = params.sectorId as string;

    const [data, setData] = useState<SectorStocksResponse['data'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/sectors/demo/${sectorId}/stocks`);
            const json: SectorStocksResponse = await res.json();

            if (!json.success) {
                throw new Error(json.error || 'Failed to fetch demo stocks');
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
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [sectorId]);

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
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Unable to Load Demo Stocks</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
                <Link href="/demo" className="btn-primary">
                    ← Back to Demo Dashboard
                </Link>
            </div>
        );
    }

    const sector = data?.sector;
    const stocks = data?.stocks || [];
    const isUp = stocks.length > 0 ? stocks[0].direction === 'UP' : true;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Demo Banner */}
            <div className="glass-card rounded-xl p-4 border-2 border-primary-500/30">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white text-lg shrink-0">
                        🎭
                    </div>
                    <div className="flex-1">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Demo Mode - Sample stock data</span>
                    </div>
                    <Link href="/demo" className="btn-ghost text-sm">
                        ← Back to Demo Dashboard
                    </Link>
                </div>
            </div>

            {/* Sector Header */}
            <div className="glass-card rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
                                {sector?.name}
                            </h1>
                            <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${isUp ? 'bullish-badge' : 'bearish-badge'}`}>
                                {isUp ? '↑ UP' : '↓ DOWN'}
                            </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400">
                            {sector?.symbol} • {stocks.length} qualifying F&O stocks
                        </p>
                    </div>

                    <SnapshotStatus
                        isFrozen={data?.isFrozen || false}
                        snapshotTime={data?.snapshotTime}
                        tradingDate={data?.tradingDate}
                    />
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
                            <p className="text-2xl font-bold text-emerald-500 font-data">{stocks.length}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Qualifying</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="stat-icon-primary">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white font-data">
                                {sector?.percentChange?.toFixed(2) || '0.00'}%
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Sector Change</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card rounded-xl p-4 col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-3">
                        <div className="stat-icon-neutral">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white font-data">
                                {sector?.currentValue?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || '0'}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Index Value</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stocks Table */}
            <StockTable stocks={stocks} title="Qualifying Stocks" />

            {/* Footer Note */}
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                Demo data updates every 5 seconds • Last updated: {data?.timestamp}
            </p>
        </div>
    );
}
