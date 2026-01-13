'use client';

import { StockData } from '@/types';
import { useState } from 'react';

interface StockTableProps {
    stocks: StockData[];
    sectorName?: string;
}

type SortKey = 'symbol' | 'ltp' | 'percentChange';
type SortOrder = 'asc' | 'desc';

export function StockTable({ stocks, sectorName }: StockTableProps) {
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
        }

        return sortOrder === 'asc' ? comparison : -comparison;
    });

    const SortIcon = ({ active, order }: { active: boolean; order: SortOrder }) => (
        <svg
            className={`w-4 h-4 transition-colors ${active ? 'text-primary-500' : 'text-gray-400'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
            {order === 'asc' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            )}
        </svg>
    );

    if (stocks.length === 0) {
        return (
            <div className="glass-dark rounded-2xl p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                    No qualifying stocks found in this sector
                </p>
            </div>
        );
    }

    return (
        <div className="glass-dark rounded-2xl overflow-hidden">
            {sectorName && (
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-800 dark:text-white">
                        Stocks in {sectorName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {stocks.length} qualifying F&O stocks with ≥1% movement
                    </p>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                            <th
                                className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-primary-500"
                                onClick={() => handleSort('symbol')}
                            >
                                <div className="flex items-center gap-1">
                                    Symbol
                                    <SortIcon active={sortKey === 'symbol'} order={sortOrder} />
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Company
                            </th>
                            <th
                                className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-primary-500"
                                onClick={() => handleSort('ltp')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    LTP
                                    <SortIcon active={sortKey === 'ltp'} order={sortOrder} />
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-primary-500"
                                onClick={() => handleSort('percentChange')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    Change
                                    <SortIcon active={sortKey === 'percentChange'} order={sortOrder} />
                                </div>
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Direction
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                F&O
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedStocks.map((stock) => {
                            const isUp = stock.direction === 'UP';

                            return (
                                <tr
                                    key={`${stock.id}-${stock.sectorId}`}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="font-semibold text-gray-800 dark:text-white">
                                            {stock.symbol}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">
                                            {stock.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <span className="font-mono text-gray-800 dark:text-white">
                                            ₹{stock.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <span className={`font-semibold ${isUp ? 'text-bullish-500' : 'text-bearish-500'}`}>
                                            {isUp ? '+' : ''}{stock.percentChange.toFixed(2)}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`
                      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${isUp ? 'bullish-badge' : 'bearish-badge'}
                    `}>
                                            {isUp ? '↑' : '↓'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {stock.isFOEligible && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-500/20 text-primary-500 border border-primary-500/30">
                                                F&O
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
