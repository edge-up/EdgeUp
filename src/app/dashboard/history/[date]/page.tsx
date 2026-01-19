'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Sector {
    id: string;
    name: string;
    symbol: string;
    currentValue: number;
    previousClose: number;
    percentChange: number;
    direction: 'UP' | 'DOWN' | 'NEUTRAL';
    qualifyingStocks: number;
    isQualifying: boolean;
}

interface Stock {
    id: string;
    symbol: string;
    name: string;
    ltp: number;
    previousClose: number;
    percentChange: number;
    direction: 'UP' | 'DOWN' | 'NEUTRAL';
    isFOEligible: boolean;
    openInterest: number | null;
    previousOI: number | null;
    oiChangePercent: number | null;
}

interface SnapshotData {
    snapshot: {
        id: string;
        tradingDate: string;
        snapshotTime: string;
        status: string;
    };
    summary: {
        totalSectors: number;
        qualifyingSectors: number;
        bullishSectors: number;
        bearishSectors: number;
        totalQualifyingStocks: number;
    };
    sectors: Sector[];
    qualifyingStocks: Stock[];
}

export default function HistoryDatePage() {
    const params = useParams();
    const date = params.date as string;
    const [data, setData] = useState<SnapshotData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSnapshot = async () => {
            try {
                const res = await fetch(`/api/snapshots/${date}`);
                const result = await res.json();

                if (!result.success) {
                    throw new Error(result.error || 'Failed to fetch');
                }

                setData(result.data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load snapshot');
            } finally {
                setLoading(false);
            }
        };

        fetchSnapshot();
    }, [date]);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatTime = (timeStr: string) => {
        const d = new Date(timeStr);
        return d.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error || 'No data found'}</p>
                    <Link href="/dashboard/history" className="btn-primary">
                        Back to History
                    </Link>
                </div>
            </div>
        );
    }

    const qualifyingSectors = data.sectors.filter(s => s.isQualifying);

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Link href="/dashboard/history" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                        📊 {formatDate(data.snapshot.tradingDate)}
                    </h1>
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                    Snapshot taken at {formatTime(data.snapshot.snapshotTime)}
                </p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="glass-card rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-primary-500">{data.summary.qualifyingSectors}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Qualifying Sectors</p>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-emerald-500">{data.summary.bullishSectors}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Bullish</p>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-rose-500">{data.summary.bearishSectors}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Bearish</p>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-slate-700 dark:text-slate-300">{data.summary.totalQualifyingStocks}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Qualifying Stocks</p>
                </div>
            </div>

            {/* Qualifying Sectors */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                    Qualifying Sectors ({qualifyingSectors.length})
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {qualifyingSectors.map((sector) => (
                        <div
                            key={sector.id}
                            className={`glass-card rounded-xl p-4 border-l-4 ${sector.direction === 'UP'
                                    ? 'border-emerald-500'
                                    : 'border-rose-500'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-medium text-slate-800 dark:text-white">{sector.name}</h3>
                                <span className={`text-lg font-bold ${sector.direction === 'UP'
                                        ? 'text-emerald-500'
                                        : 'text-rose-500'
                                    }`}>
                                    {sector.direction === 'UP' ? '+' : ''}{sector.percentChange.toFixed(2)}%
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                                <span>{sector.currentValue.toLocaleString()}</span>
                                <span>{sector.qualifyingStocks} qualifying stocks</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Qualifying Stocks Table */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    Qualifying Stocks ({data.qualifyingStocks.length})
                </h2>
                <div className="glass-card rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stock</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">LTP</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Change</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">OI Change</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {data.qualifyingStocks.map((stock) => (
                                    <tr key={stock.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium text-slate-800 dark:text-white">{stock.symbol}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{stock.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-white">
                                            ₹{stock.ltp.toLocaleString()}
                                        </td>
                                        <td className={`px-4 py-3 text-right font-medium ${stock.direction === 'UP' ? 'text-emerald-500' : 'text-rose-500'
                                            }`}>
                                            {stock.direction === 'UP' ? '+' : ''}{stock.percentChange.toFixed(2)}%
                                        </td>
                                        <td className={`px-4 py-3 text-right font-medium ${stock.oiChangePercent && stock.oiChangePercent > 0
                                                ? 'text-emerald-500'
                                                : stock.oiChangePercent && stock.oiChangePercent < 0
                                                    ? 'text-rose-500'
                                                    : 'text-slate-500'
                                            }`}>
                                            {stock.oiChangePercent
                                                ? `${stock.oiChangePercent > 0 ? '+' : ''}${stock.oiChangePercent.toFixed(2)}%`
                                                : '-'
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
