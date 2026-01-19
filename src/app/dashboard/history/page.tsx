'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SnapshotSummary {
    id: string;
    tradingDate: string;
    snapshotTime: string;
    status: string;
    totalSectors: number;
    qualifyingSectors: number;
    bullishSectors: number;
    bearishSectors: number;
    totalStocks: number;
    qualifyingStocks: number;
}

export default function HistoryPage() {
    const [snapshots, setSnapshots] = useState<SnapshotSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchSnapshots = async () => {
            try {
                const res = await fetch('/api/snapshots');
                const data = await res.json();

                if (!data.success) {
                    throw new Error(data.error || 'Failed to fetch');
                }

                setSnapshots(data.data.snapshots);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load history');
            } finally {
                setLoading(false);
            }
        };

        fetchSnapshots();
    }, []);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (timeStr: string) => {
        const date = new Date(timeStr);
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-slate-500 dark:text-slate-400">Loading history...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button onClick={() => location.reload()} className="btn-primary">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                        📅 Historical Snapshots
                    </h1>
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                    View qualifying sectors and stocks from past trading days
                </p>
            </div>

            {/* Snapshot List */}
            {snapshots.length === 0 ? (
                <div className="glass-card rounded-xl p-12 text-center">
                    <p className="text-slate-500 dark:text-slate-400 text-lg">
                        No snapshots available yet. Check back after market hours!
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {snapshots.map((snapshot) => (
                        <div
                            key={snapshot.id}
                            onClick={() => router.push(`/dashboard/history/${snapshot.tradingDate}`)}
                            className="glass-card rounded-xl p-5 hover:bg-white/80 dark:hover:bg-slate-800/80 cursor-pointer transition-all card-hover"
                        >
                            <div className="flex items-center justify-between">
                                {/* Date & Time */}
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold text-lg">
                                        {new Date(snapshot.tradingDate).getDate()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-800 dark:text-white">
                                            {formatDate(snapshot.tradingDate)}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Snapshot at {formatTime(snapshot.snapshotTime)}
                                        </p>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="hidden md:flex items-center gap-6">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-primary-500">
                                            {snapshot.qualifyingSectors}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Sectors</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-emerald-500">
                                            {snapshot.bullishSectors}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Bullish</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-rose-500">
                                            {snapshot.bearishSectors}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Bearish</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                                            {snapshot.qualifyingStocks}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Stocks</p>
                                    </div>
                                </div>

                                {/* Mobile Stats */}
                                <div className="md:hidden flex items-center gap-3">
                                    <span className="px-2 py-1 bg-primary-500/10 text-primary-500 rounded-full text-sm font-medium">
                                        {snapshot.qualifyingSectors} sectors
                                    </span>
                                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-sm font-medium">
                                        {snapshot.qualifyingStocks} stocks
                                    </span>
                                </div>

                                {/* Arrow */}
                                <div className="hidden md:block">
                                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
