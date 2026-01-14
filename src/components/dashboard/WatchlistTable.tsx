'use client';

import { StockData } from '@/types';

interface WatchlistTableProps {
    stocks: StockData[];
    sectorName?: string;
}

export const WatchlistTable: React.FC<WatchlistTableProps> = ({ stocks, sectorName }) => {
    if (stocks.length === 0) {
        return null;
    }

    return (
        <div className="glass-dark rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                        Watchlist - Price Movers ({stocks.length})
                    </h2>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Stocks with ≥1% price change but OI change below 7% threshold
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Stock
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                LTP
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Price Change
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Current OI
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                OI Change
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Reason
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {stocks.map((stock) => {
                            const isUp = stock.direction === 'UP';
                            const oiChange = stock.oiChangePercent || 0;

                            return (
                                <tr key={stock.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-4 py-4">
                                        <div>
                                            <p className="font-medium text-gray-800 dark:text-white">{stock.symbol}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{stock.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <span className="font-medium text-gray-800 dark:text-white">
                                            ₹{stock.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <span className={`font-semibold ${isUp ? 'text-bullish-500' : 'text-bearish-500'}`}>
                                            {isUp ? '+' : ''}{stock.percentChange.toFixed(2)}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <span className="text-gray-600 dark:text-gray-300">
                                            {stock.openInterest
                                                ? (stock.openInterest / 1000000).toFixed(2) + 'M'
                                                : '-'
                                            }
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <span className={`font-medium ${oiChange > 0 ? 'text-blue-500' : oiChange < 0 ? 'text-orange-500' : 'text-gray-500'
                                            }`}>
                                            {oiChange > 0 ? '+' : ''}{oiChange.toFixed(2)}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400 rounded-full">
                                            OI &lt; 7%
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    💡 These stocks are strong price movers but lack significant OI buildup.
                    They may qualify if OI increases above 7% threshold.
                </p>
            </div>
        </div>
    );
};
