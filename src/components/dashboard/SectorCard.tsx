import Link from 'next/link';
import { SectorData } from '@/types';

interface SectorCardProps {
    sector: SectorData;
    href?: string;
    basePath?: string;
}

export function SectorCard({ sector, href, basePath = '/dashboard/sectors' }: SectorCardProps) {
    const isUp = sector.direction === 'UP';
    const linkHref = href || `${basePath}/${sector.id}`;

    return (
        <Link href={linkHref} className="block group">
            <div className={`
                glass-card rounded-2xl p-6 
                transition-all duration-300 ease-out
                hover:scale-[1.02] hover:-translate-y-1
                hover:shadow-2xl
                ${isUp
                    ? 'hover:shadow-emerald-500/20 border-l-4 border-l-emerald-500'
                    : 'hover:shadow-rose-500/20 border-l-4 border-l-rose-500'
                }
            `}>
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 dark:text-white text-lg truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {sector.name}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                            {sector.symbol}
                        </p>
                    </div>

                    {/* Direction Badge */}
                    <div className={`
                        px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5
                        transition-all duration-300 group-hover:scale-105
                        ${isUp ? 'bullish-badge' : 'bearish-badge'}
                    `}>
                        <svg
                            className={`w-4 h-4 transition-transform duration-300 ${isUp ? 'group-hover:-translate-y-0.5' : 'group-hover:translate-y-0.5'}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                        >
                            {isUp ? (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            )}
                        </svg>
                        <span>{isUp ? 'BULL' : 'BEAR'}</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="space-y-4">
                    {/* Percent Change - Hero Stat */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Change</span>
                        <span className={`text-3xl font-bold font-data tabular-nums ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isUp ? '+' : ''}{sector.percentChange.toFixed(2)}%
                        </span>
                    </div>

                    {/* Divider */}
                    <div className="divider" />

                    {/* Current Value */}
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Current</span>
                        <span className="text-slate-800 dark:text-white font-semibold font-data">
                            {sector.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                    </div>

                    {/* Qualifying Stocks */}
                    {sector.qualifyingStockCount !== undefined && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">F&O Stocks</span>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-800 dark:text-white font-semibold">
                                    {sector.qualifyingStockCount}
                                </span>
                                <svg
                                    className="w-4 h-4 text-slate-400 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
