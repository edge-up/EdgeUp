'use client';

import { StockData } from '@/types';
import { useState } from 'react';

interface StockTableProps {
    stocks: StockData[];
    sectorName?: string;
    title?: string;
}

type SortKey = 'symbol' | 'ltp' | 'percentChange' | 'oiChangePercent';
type SortOrder = 'asc' | 'desc';

export function StockTable({ stocks, sectorName, title }: StockTableProps) {
    const [sortKey, setSortKey] = useState<SortKey>('percentChange');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('desc');
        }
    };

    const sortedStocks = [...stocks].sort((a, b) => {
        let comparison = 0;

        switch (sortKey) {
            case 'symbol':
                comparison = a.symbol.localeCompare(b.symbol);
                break;
            case 'ltp':
                comparison = a.ltp - b.ltp;
                break;
            case 'percentChange':
                comparison = Math.abs(a.percentChange) - Math.abs(b.percentChange);
                break;
            case 'oiChangePercent':
                comparison = Math.abs(a.oiChangePercent || 0) - Math.abs(b.oiChangePercent || 0);
                break;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
    });

    const SortIcon = ({ active, order }: { active: boolean; order: SortOrder }) => (
        <svg
            className={`w-3.5 h-3.5 transition-all duration-200 ${active ? 'text-primary-500' : 'text-slate-400 opacity-0 group-hover:opacity-100'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
            {order === 'asc' ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            )}
        </svg>
    );

    if (stocks.length === 0) {
        return (
            <div className="glass-card rounded-2xl p-10 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                    No Qualifying Stocks
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    No F&O stocks have met all qualification criteria in this sector yet.
                </p>
            </div>
        );
    }

    return (
        <div className="glass-card rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-slate-50/50 to-transparent dark:from-slate-800/50">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            {title || (sectorName ? `Stocks in ${sectorName}` : 'Qualifying Stocks')}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            {stocks.length} F&O {stocks.length === 1 ? 'stock' : 'stocks'} with ≥1% price, ≥3% OI change, and breakout/breakdown
                        </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Bullish</span>
                        <span className="w-2 h-2 rounded-full bg-rose-500 ml-2"></span>
                        <span>Bearish</span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                    <thead>
                        <tr className="sticky-header border-b border-slate-200/50 dark:border-slate-700/50">
                            <th
                                className="group px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-primary-500 transition-colors"
                                onClick={() => handleSort('symbol')}
                            >
                                <div className="flex items-center gap-1.5">
                                    Symbol
                                    <SortIcon active={sortKey === 'symbol'} order={sortOrder} />
                                </div>
                            </th>
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Company
                            </th>
                            <th
                                className="group px-6 py-3.5 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-primary-500 transition-colors"
                                onClick={() => handleSort('ltp')}
                            >
                                <div className="flex items-center justify-end gap-1.5">
                                    LTP
                                    <SortIcon active={sortKey === 'ltp'} order={sortOrder} />
                                </div>
                            </th>
                            <th
                                className="group px-6 py-3.5 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-primary-500 transition-colors"
                                onClick={() => handleSort('percentChange')}
                            >
                                <div className="flex items-center justify-end gap-1.5">
                                    Change
                                    <SortIcon active={sortKey === 'percentChange'} order={sortOrder} />
                                </div>
                            </th>
                            <th
                                className="group px-6 py-3.5 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-primary-500 transition-colors"
                                onClick={() => handleSort('oiChangePercent')}
                            >
                                <div className="flex items-center justify-end gap-1.5">
                                    OI Chg
                                    <SortIcon active={sortKey === 'oiChangePercent'} order={sortOrder} />
                                </div>
                            </th>
                            <th className="px-6 py-3.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Signal
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {sortedStocks.map((stock, index) => {
                            const isUp = stock.direction === 'UP';
                            const oiChange = stock.oiChangePercent || 0;
                            const isOiUp = oiChange >= 0;

                            return (
                                <tr
                                    key={`${stock.id}-${stock.sectorId}`}
                                    className="table-row-hover group"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-1 h-8 rounded-full ${isUp ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                            <span className="font-semibold text-slate-800 dark:text-white">
                                                {stock.symbol}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-slate-600 dark:text-slate-300 line-clamp-1 max-w-[200px]">
                                            {stock.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <span className="font-data text-slate-800 dark:text-white">
                                            ₹{stock.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <span className={`font-semibold font-data ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {isUp ? '+' : ''}{stock.percentChange.toFixed(2)}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <span className={`font-data text-sm ${isOiUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {isOiUp ? '+' : ''}{oiChange.toFixed(2)}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {stock.breakoutType && (
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${stock.breakoutType === 'BREAKOUT'
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                    }`}
                                                title={
                                                    stock.breakoutType === 'BREAKOUT'
                                                        ? `Price above prev day high (₹${stock.previousDayHigh?.toFixed(2)})`
                                                        : `Price below prev day low (₹${stock.previousDayLow?.toFixed(2)})`
                                                }
                                            >
                                                {stock.breakoutType === 'BREAKOUT' ? '⬆️' : '⬇️'}
                                                {stock.breakoutType}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
