'use client';

import { useEffect, useState } from 'react';
import { SectorCard } from '@/components/dashboard/SectorCard';
import { SnapshotStatus } from '@/components/dashboard/SnapshotStatus';
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
}

export default function DemoDashboardPage() {
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
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">Loading demo data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-dark rounded-2xl p-8 text-center">
                <p className="text-bearish-500 mb-4">{error}</p>
                <Link href="/dashboard" className="text-primary-500 hover:text-primary-400">
                    ← Back to Real Dashboard
                </Link>
            </div>
        );
    }

    const sectors = data?.sectors || [];
    const bullishSectors = sectors.filter(s => s.direction === 'UP');
    const bearishSectors = sectors.filter(s => s.direction === 'DOWN');

    return (
        <div className="space-y-8">
            {/* Demo Banner */}
            <div className="glass-dark rounded-2xl p-6 border-2 border-primary-500/30">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">🎭</span>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Demo Mode</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            You're viewing sample market data. This is how the dashboard will look with real Dhan API data.
                        </p>
                    </div>
                    <Link
                        href="/dashboard"
                        className="px-4 py-2 text-sm bg-primary-500/20 text-primary-500 rounded-lg hover:bg-primary-500/30 transition-colors"
                    >
                        Real Dashboard →
                    </Link>
                </div>
            </div>

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

            {/* Bullish Sectors */}
            {bullishSectors.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-bullish-500"></span>
                        Bullish Sectors ({bullishSectors.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bullishSectors.map(sector => (
                            <SectorCard key={sector.id} sector={sector} href={`/dashboard/demo/${sector.id}`} />
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
                            <SectorCard key={sector.id} sector={sector} href={`/dashboard/demo/${sector.id}`} />
                        ))}
                    </div>
                </section>
            )}

            {/* Footer Note */}
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                {data?.message} • Updates every 5 seconds • Last: {data?.timestamp}
            </p>
        </div>
    );
}
