'use client';

import { useEffect, useState } from 'react';
import { SectorCard } from '@/components/dashboard/SectorCard';
import { SnapshotStatus } from '@/components/dashboard/SnapshotStatus';
import { DashboardSkeleton } from '@/components/ui/LoadingSkeleton';
import { SectorData } from '@/types';
import Link from 'next/link';

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

export default function DemoDashboard() {
    const [data, setData] = useState<SectorsResponse['data'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/sectors/demo');
            const json: SectorsResponse = await res.json();

            if (!json.success) {
                throw new Error('Failed to fetch demo sectors');
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

        // Refresh every 5 seconds to simulate live updates
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

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
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Unable to Load Demo</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
                <Link href="/dashboard" className="btn-primary">
                    ← Go to Real Dashboard
                </Link>
            </div>
        );
    }

    const sectors = data?.sectors || [];
    const bullishSectors = sectors.filter(s => s.direction === 'UP');
    const bearishSectors = sectors.filter(s => s.direction === 'DOWN');

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Demo Banner */}
            <div className="glass-card rounded-2xl p-6 border-2 border-primary-500/30">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center text-white text-2xl shrink-0">
                        🎭
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Demo Mode</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            You're viewing sample market data. This is how the dashboard looks with real Dhan API data.
                        </p>
                    </div>
                    <Link
                        href="/login"
                        className="btn-primary"
                    >
                        Login to View Real Data →
                    </Link>
                </div>
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                        Market Dashboard
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        NSE sector momentum and qualifying F&O stocks
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
                                <SectorCard sector={sector} href={`/demo/${sector.id}`} />
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
                                <SectorCard sector={sector} href={`/demo/${sector.id}`} />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Footer Note */}
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                {data?.message} • Updates every 5 seconds • Last: {data?.timestamp}
            </p>
        </div>
    );
}
