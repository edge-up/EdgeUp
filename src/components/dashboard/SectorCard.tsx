import Link from 'next/link';
import { SectorData } from '@/types';

interface SectorCardProps {
    sector: SectorData;
    href?: string; // Optional custom href for demo mode
}

export function SectorCard({ sector, href }: SectorCardProps) {
    const isUp = sector.direction === 'UP';
    const linkHref = href || `/dashboard/sectors/${sector.id}`;

    return (
        <Link href={linkHref}>
            <div className={`
        glass-dark rounded-2xl p-6 card-hover cursor-pointer
        border-l-4 ${isUp ? 'border-l-bullish-500' : 'border-l-bearish-500'}
      `}>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white text-lg">
                            {sector.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {sector.symbol}
                        </p>
                    </div>

                    {/* Direction Badge */}
                    <div className={`
            px-3 py-1 rounded-full text-sm font-medium
            ${isUp ? 'bullish-badge' : 'bearish-badge'}
          `}>
                        {isUp ? '↑ UP' : '↓ DOWN'}
                    </div>
                </div>

                {/* Stats */}
                <div className="space-y-3">
                    {/* Percent Change */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Change</span>
                        <span className={`text-2xl font-bold ${isUp ? 'text-bullish-500' : 'text-bearish-500'}`}>
                            {isUp ? '+' : ''}{sector.percentChange.toFixed(2)}%
                        </span>
                    </div>

                    {/* Current Value */}
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Index Value</span>
                        <span className="text-gray-800 dark:text-white font-medium">
                            {sector.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                    </div>

                    {/* Qualifying Stocks */}
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Qualifying Stocks</span>
                        <span className="text-primary-500 font-semibold">
                            {sector.qualifyingStockCount}
                        </span>
                    </div>
                </div>

                {/* Footer - View More */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-primary-500 font-medium flex items-center gap-1">
                        View Stocks
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </span>
                </div>
            </div>
        </Link>
    );
}
