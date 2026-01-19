'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PriceChart } from '@/components/charts/PriceChart';
import { OIChart } from '@/components/charts/OIChart';

interface StockData {
    stock: {
        id: string;
        symbol: string;
        name: string;
        isin: string | null;
        industry: string | null;
        isFOEligible: boolean;
        lotSize: number | null;
        sectors: { id: string; name: string; symbol: string }[];
    };
    currentQuote: {
        ltp: number;
        open: number;
        high: number;
        low: number;
        previousClose: number;
        change: number;
        changePercent: number;
        volume: number;
        openInterest: number | null;
    } | null;
    historicalData: {
        date: string;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }[];
    oiHistory: {
        date: string;
        oi: number | null;
        oiChange: number | null;
        ltp: number;
        priceChange: number;
    }[];
}

export default function StockDetailPage() {
    const params = useParams();
    const symbol = (params.symbol as string).toUpperCase();
    const [data, setData] = useState<StockData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStock = async () => {
            try {
                const res = await fetch(`/api/stocks/${symbol}`);
                const result = await res.json();

                if (!result.success) {
                    throw new Error(result.error || 'Failed to fetch');
                }

                setData(result.data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load stock');
            } finally {
                setLoading(false);
            }
        };

        fetchStock();
    }, [symbol]);

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
                    <p className="text-red-500 mb-4">{error || 'Stock not found'}</p>
                    <Link href="/dashboard" className="btn-primary">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const { stock, currentQuote, historicalData, oiHistory } = data;
    const isPositive = currentQuote && currentQuote.changePercent >= 0;

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
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                            {stock.symbol}
                            {stock.isFOEligible && (
                                <span className="px-2 py-0.5 bg-primary-500/10 text-primary-500 text-xs font-medium rounded-full">
                                    F&O
                                </span>
                            )}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">{stock.name}</p>
                    </div>
                </div>

                {/* Sectors */}
                {stock.sectors.length > 0 && (
                    <div className="flex gap-2 mt-2">
                        {stock.sectors.map(sector => (
                            <Link
                                key={sector.id}
                                href={`/dashboard/sectors/${sector.id}`}
                                className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                {sector.name}
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Current Quote */}
            {currentQuote && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <div className="glass-card rounded-xl p-4 col-span-2 md:col-span-1">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">LTP</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">
                            ₹{currentQuote.ltp.toLocaleString()}
                        </p>
                        <p className={`text-sm font-medium ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isPositive ? '+' : ''}{currentQuote.changePercent.toFixed(2)}%
                        </p>
                    </div>
                    <div className="glass-card rounded-xl p-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Day High</p>
                        <p className="text-lg font-semibold text-slate-800 dark:text-white">
                            ₹{currentQuote.high.toLocaleString()}
                        </p>
                    </div>
                    <div className="glass-card rounded-xl p-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Day Low</p>
                        <p className="text-lg font-semibold text-slate-800 dark:text-white">
                            ₹{currentQuote.low.toLocaleString()}
                        </p>
                    </div>
                    <div className="glass-card rounded-xl p-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Volume</p>
                        <p className="text-lg font-semibold text-slate-800 dark:text-white">
                            {(currentQuote.volume / 100000).toFixed(2)}L
                        </p>
                    </div>
                    <div className="glass-card rounded-xl p-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Open Interest</p>
                        <p className="text-lg font-semibold text-slate-800 dark:text-white">
                            {currentQuote.openInterest
                                ? `${(currentQuote.openInterest / 100000).toFixed(2)}L`
                                : '-'
                            }
                        </p>
                    </div>
                </div>
            )}

            {/* Price Chart */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                    Price Chart
                </h2>
                <div className="glass-card rounded-xl p-4">
                    <PriceChart data={historicalData} height={350} />
                </div>
            </div>

            {/* OI Chart */}
            {stock.isFOEligible && (
                <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        Open Interest Trend
                    </h2>
                    <div className="glass-card rounded-xl p-4">
                        <OIChart data={oiHistory} height={250} />
                    </div>
                </div>
            )}

            {/* Stock Info */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
                    Stock Information
                </h2>
                <div className="glass-card rounded-xl p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">ISIN</p>
                            <p className="font-medium text-slate-800 dark:text-white">{stock.isin || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Industry</p>
                            <p className="font-medium text-slate-800 dark:text-white">{stock.industry || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Lot Size</p>
                            <p className="font-medium text-slate-800 dark:text-white">{stock.lotSize?.toLocaleString() || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Previous Close</p>
                            <p className="font-medium text-slate-800 dark:text-white">
                                {currentQuote ? `₹${currentQuote.previousClose.toLocaleString()}` : '-'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
