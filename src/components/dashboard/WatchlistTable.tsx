'use client';

import { StockData } from '@/types';

interface WatchlistTableProps {
    stocks: StockData[];
}

export function WatchlistTable({ stocks }: WatchlistTableProps) {
    if (stocks.length === 0) {
        return null;
    }

    return (
        <div className="glass-card rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-900/10">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            Watchlist
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            {stocks.length} {stocks.length === 1 ? 'stock' : 'stocks'} with price ≥1% but OI &lt;7%
                        </p>
                    </div>
                    <div className="hidden sm:block px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                        Monitoring
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            <div className="px-6 py-3 bg-amber-50/50 dark:bg-amber-900/10 border-b border-amber-100/50 dark:border-amber-800/20">
                <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    These stocks meet the price threshold but not the Open Interest criteria. Watch for OI buildup.
                </p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                    <thead>
                        <tr className="sticky-header border-b border-slate-200/50 dark:border-slate-700/50">
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Symbol
                            </th>
                            <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                LTP
                            </th>
                            <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Price Chg
                            </th>
                            <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Current OI
                            </th>
                            <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                OI Change
                            </th>
                            <th className="px-6 py-3.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {stocks.map((stock) => {
                            const isUp = stock.direction === 'UP';
                            const oiChange = stock.oiChangePercent || 0;
                            const isOiUp = oiChange >= 0;
                            const currentOI = stock.openInterest || 0;

                            return (
                                <tr
                                    key={`${stock.id}-watchlist`}
                                    className="table-row-hover"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-1 h-8 rounded-full ${isUp ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                            <div>
                                                <span className="font-semibold text-slate-800 dark:text-white block">
                                                    {stock.symbol}
                                                </span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    {stock.name?.substring(0, 20)}{stock.name && stock.name.length > 20 ? '...' : ''}
                                                </span>
                                            </div>
                                        </div>
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
                                        <span className="font-data text-sm text-slate-600 dark:text-slate-300">
                                            {currentOI > 0 ? (currentOI / 1000000).toFixed(2) + 'M' : '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <span className={`font-data text-sm ${isOiUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {isOiUp ? '+' : ''}{oiChange.toFixed(2)}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            OI &lt; 7%
                                        </span>
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
