'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AdvancedStockChart } from '@/components/charts/AdvancedStockChart';
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
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-slate-500 dark:text-slate-400">Loading {symbol}...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="glass-card rounded-2xl p-8 text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-500/15 flex items-center justify-center">
                        <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Stock Not Found</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">{error || 'Unable to load stock data'}</p>
                    <Link href="/dashboard" className="btn-primary">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const { stock, currentQuote, historicalData, oiHistory } = data;
    const isPositive = currentQuote && currentQuote.changePercent >= 0;

    // Calculate 52-week high/low from historical data
    const prices = historicalData.map(d => d.high);
    const week52High = prices.length > 0 ? Math.max(...prices) : 0;
    const week52Low = prices.length > 0 ? Math.min(...historicalData.map(d => d.low)) : 0;

    // Transform data for AdvancedStockChart
    const ohlcData = historicalData.map(d => ({
        timestamp: d.date,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume,
    }));

    const oiHistoryForChart = oiHistory.map(d => ({
        timestamp: d.date,
        openInterest: d.oi || 0,
    }));

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
                <Link
                    href="/dashboard"
                    className="mt-1 p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">
                            {stock.symbol}
                        </h1>
                        {stock.isFOEligible && (
                            <span className="px-3 py-1 bg-primary-500/15 text-primary-600 dark:text-primary-400 text-xs font-semibold rounded-full border border-primary-500/30">
                                F&O Eligible
                            </span>
                        )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mb-2">{stock.name}</p>

                    {/* Sectors */}
                    {stock.sectors.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {stock.sectors.map(sector => (
                                <Link
                                    key={sector.id}
                                    href={`/dashboard/sectors/${sector.id}`}
                                    className="text-xs px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    {sector.name}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Key Metrics Grid */}
            {currentQuote && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {/* LTP */}
                    <div className="glass-card rounded-xl p-4 col-span-2 sm:col-span-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Last Price</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">
                            ₹{currentQuote.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className={`text-sm font-semibold mt-1 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isPositive ? '▲' : '▼'} {isPositive ? '+' : ''}{currentQuote.changePercent.toFixed(2)}%
                        </p>
                    </div>

                    {/* Open */}
                    <div className="glass-card rounded-xl p-4">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Open</p>
                        <p className="text-lg font-semibold text-slate-800 dark:text-white">
                            ₹{currentQuote.open.toLocaleString('en-IN')}
                        </p>
                    </div>

                    {/* Day High */}
                    <div className="glass-card rounded-xl p-4">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Day High</p>
                        <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                            ₹{currentQuote.high.toLocaleString('en-IN')}
                        </p>
                    </div>

                    {/* Day Low */}
                    <div className="glass-card rounded-xl p-4">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Day Low</p>
                        <p className="text-lg font-semibold text-rose-600 dark:text-rose-400">
                            ₹{currentQuote.low.toLocaleString('en-IN')}
                        </p>
                    </div>

                    {/* Volume */}
                    <div className="glass-card rounded-xl p-4">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Volume</p>
                        <p className="text-lg font-semibold text-slate-800 dark:text-white">
                            {(currentQuote.volume / 100000).toFixed(2)}L
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {currentQuote.volume.toLocaleString('en-IN')}
                        </p>
                    </div>

                    {/* Open Interest */}
                    <div className="glass-card rounded-xl p-4">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Open Interest</p>
                        <p className="text-lg font-semibold text-slate-800 dark:text-white">
                            {currentQuote.openInterest
                                ? `${(currentQuote.openInterest / 100000).toFixed(2)}L`
                                : 'N/A'
                            }
                        </p>
                        {currentQuote.openInterest && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {currentQuote.openInterest.toLocaleString('en-IN')}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Advanced Price Chart */}
            <AdvancedStockChart
                symbol={stock.symbol}
                ohlcData={ohlcData}
                oiHistory={oiHistoryForChart}
                currentPrice={currentQuote?.ltp || 0}
                previousClose={currentQuote?.previousClose || 0}
            />

            {/* Additional Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Trading Info */}
                <div className="glass-card rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                        Trading Information
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-slate-200/50 dark:border-slate-700/50">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Previous Close</span>
                            <span className="font-semibold text-slate-800 dark:text-white">
                                ₹{currentQuote?.previousClose.toLocaleString('en-IN') || '-'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-200/50 dark:border-slate-700/50">
                            <span className="text-sm text-slate-600 dark:text-slate-400">52 Week High</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                ₹{week52High.toLocaleString('en-IN')}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-200/50 dark:border-slate-700/50">
                            <span className="text-sm text-slate-600 dark:text-slate-400">52 Week Low</span>
                            <span className="font-semibold text-rose-600 dark:text-rose-400">
                                ₹{week52Low.toLocaleString('en-IN')}
                            </span>
                        </div>
                        {stock.lotSize && (
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-slate-600 dark:text-slate-400">Lot Size</span>
                                <span className="font-semibold text-slate-800 dark:text-white">
                                    {stock.lotSize.toLocaleString('en-IN')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Company Info */}
                <div className="glass-card rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
                        Company Details
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-slate-200/50 dark:border-slate-700/50">
                            <span className="text-sm text-slate-600 dark:text-slate-400">ISIN</span>
                            <span className="font-mono text-sm font-medium text-slate-800 dark:text-white">
                                {stock.isin || '-'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-200/50 dark:border-slate-700/50">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Industry</span>
                            <span className="font-semibold text-slate-800 dark:text-white">
                                {stock.industry || '-'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-slate-600 dark:text-slate-400">F&O Status</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${stock.isFOEligible
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-slate-500/15 text-slate-600 dark:text-slate-400'
                                }`}>
                                {stock.isFOEligible ? 'Eligible' : 'Not Eligible'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* OI Trend for F&O stocks */}
            {stock.isFOEligible && oiHistory.length > 0 && (
                <div className="glass-card rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        Open Interest Trend
                    </h3>
                    <OIChart data={oiHistory} height={300} />
                </div>
            )}
        </div>
    );
}
