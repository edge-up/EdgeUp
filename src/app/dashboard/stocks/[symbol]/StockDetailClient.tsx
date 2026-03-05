'use client';

import { StockData } from '@/types';
import { formatTimeIST } from '@/lib/utils/market-time';
import { AdvancedStockChart } from '@/components/charts/AdvancedStockChart';
import { OI_CHANGE_THRESHOLD } from '@/lib/config';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface StockDetailClientProps {
    stock: StockData;
}

export default function StockDetailClient({ stock }: StockDetailClientProps) {
    const [candles, setCandles] = useState<any[]>([]);

    useEffect(() => {
        const fetchIntraday = async () => {
            try {
                const res = await fetch(`/api/stocks/${stock.symbol}/intraday`);
                const result = await res.json();
                if (result.success && result.data?.candles) {
                    setCandles(result.data.candles);
                }
            } catch (error) {
                console.error('Failed to fetch intraday data:', error);
            }
        };
        fetchIntraday();
    }, [stock.symbol]);

    const isUp = stock.direction === 'UP';
    const oiChange = stock.oiChangePercent || 0;
    const isOiUp = oiChange >= 0;
    const currentOI = stock.openInterest || 0;
    const prevOI = stock.previousOpenInterest || 0;

    return (
        <div className="space-y-6">
            {/* Navigation / Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard"
                    className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </Link>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{stock.symbol}</h1>
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {stock.sectorName}
                        </span>
                        {stock.isFOEligible && (
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                F&O
                            </span>
                        )}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">{stock.name}</p>
                </div>
            </div>

            {/* Price & OI Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Price Card */}
                <div className="glass-card p-5 rounded-2xl">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Current Price</p>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-3xl font-data font-bold text-slate-900 dark:text-white">
                            ₹{stock.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </h2>
                        <span className={`font-semibold font-data ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isUp ? '+' : ''}{stock.percentChange.toFixed(2)}%
                        </span>
                    </div>
                </div>

                {/* Open Interest Card */}
                <div className="glass-card p-5 rounded-2xl">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Open Interest (OI)</p>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-3xl font-data font-bold text-slate-900 dark:text-white">
                            {currentOI > 0 ? (currentOI / 1000000).toFixed(2) + 'M' : '-'}
                        </h2>
                        {stock.isFOEligible && (
                            <span className={`font-semibold font-data ${isOiUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {isOiUp ? '+' : ''}{oiChange.toFixed(2)}%
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        Prev: {prevOI > 0 ? (prevOI / 1000000).toFixed(2) + 'M' : '-'}
                    </p>
                </div>

                {/* Day High/Low */}
                <div className="glass-card p-5 rounded-2xl">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Day Range</p>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400">Low</span>
                            <span className="text-xs text-slate-400">High</span>
                        </div>
                        <div className="relative h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                                className="absolute h-2 rounded-full bg-primary-500/50"
                                style={{
                                    left: `${((stock.ltp - (stock.low || stock.ltp)) / ((stock.high || stock.ltp) - (stock.low || stock.ltp) || 1)) * 100}%`,
                                    width: '4px',
                                    backgroundColor: 'var(--primary-500)'
                                }}
                            />
                        </div>
                        <div className="flex justify-between items-center font-data text-sm text-slate-700 dark:text-slate-300">
                            <span>₹{stock.low?.toLocaleString('en-IN') || '-'}</span>
                            <span>₹{stock.high?.toLocaleString('en-IN') || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* Previous Day Range */}
                <div className="glass-card p-5 rounded-2xl">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Prev Day Range</p>
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">High:</span>
                            <span className="font-data text-slate-800 dark:text-slate-200">₹{stock.previousDayHigh?.toLocaleString('en-IN') || '-'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Low:</span>
                            <span className="font-data text-slate-800 dark:text-slate-200">₹{stock.previousDayLow?.toLocaleString('en-IN') || '-'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Open:</span>
                            <span className="font-data text-slate-800 dark:text-slate-200">₹{stock.previousDayOpen?.toLocaleString('en-IN') || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analysis & Signals */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Signals Panel */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="glass-card p-6 rounded-2xl h-full">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Momentum Signals</h3>
                        <div className="space-y-4">
                            {/* Price Signal */}
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Price Action</p>
                                {stock.breakoutType === 'BREAKOUT' ? (
                                    <div className="flex items-center gap-2 text-emerald-500 font-semibold">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                        Intraday Breakout
                                    </div>
                                ) : stock.breakoutType === 'BREAKDOWN' ? (
                                    <div className="flex items-center gap-2 text-rose-500 font-semibold">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                                        </svg>
                                        Intraday Breakdown
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-semibold">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                                        </svg>
                                        Inside Range
                                    </div>
                                )}
                            </div>

                            {/* OI Signal */}
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">OI Accumulation</p>
                                {Math.abs(oiChange) >= OI_CHANGE_THRESHOLD ? (
                                    <div className={`flex items-center gap-2 font-semibold ${isOiUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        {isOiUp ? 'High Long Build-up' : 'High Short Covering'}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-semibold">
                                        Low OI Activity
                                    </div>
                                )}
                            </div>

                            {/* Volatility */}
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Qualification</p>
                                {stock.isQualifying ? (
                                    <div className="flex items-center gap-2 text-emerald-500 font-semibold">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Momentum Qualified
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 font-semibold">
                                        Not Qualified
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <p className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Trading Advice: Wait for confirmation on the 5-minute chart before entering {isUp ? 'long' : 'short'} positions.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="lg:col-span-2">
                    <div className="glass-card p-4 rounded-2xl h-[500px]">
                        <AdvancedStockChart
                            symbol={stock.symbol}
                            ohlcData={candles}
                            currentPrice={stock.ltp}
                            previousClose={stock.previousClose}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
