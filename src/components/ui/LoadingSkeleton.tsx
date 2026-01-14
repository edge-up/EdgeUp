'use client';

import { FC } from 'react';

interface SkeletonProps {
    className?: string;
}

// Basic skeleton line
export const Skeleton: FC<SkeletonProps> = ({ className = '' }) => (
    <div className={`skeleton ${className}`} />
);

// Skeleton for sector cards
export const SectorCardSkeleton: FC = () => (
    <div className="glass-card rounded-2xl p-6 animate-pulse">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
            <div>
                <div className="h-5 w-32 skeleton rounded mb-2" />
                <div className="h-4 w-24 skeleton rounded" />
            </div>
            <div className="h-7 w-16 skeleton rounded-full" />
        </div>

        {/* Stats */}
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="h-4 w-16 skeleton rounded" />
                <div className="h-8 w-20 skeleton rounded" />
            </div>
            <div className="flex items-center justify-between">
                <div className="h-4 w-20 skeleton rounded" />
                <div className="h-5 w-24 skeleton rounded" />
            </div>
            <div className="flex items-center justify-between">
                <div className="h-4 w-24 skeleton rounded" />
                <div className="h-5 w-16 skeleton rounded" />
            </div>
        </div>
    </div>
);

// Skeleton for stats cards grid
export const StatsGridSkeleton: FC = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 skeleton rounded-xl" />
                    <div className="flex-1">
                        <div className="h-6 w-12 skeleton rounded mb-1" />
                        <div className="h-4 w-20 skeleton rounded" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

// Skeleton for stock table rows
export const TableRowSkeleton: FC = () => (
    <tr className="animate-pulse">
        <td className="px-4 py-3">
            <div className="h-5 w-20 skeleton rounded" />
        </td>
        <td className="px-4 py-3">
            <div className="h-5 w-24 skeleton rounded" />
        </td>
        <td className="px-4 py-3">
            <div className="h-5 w-16 skeleton rounded" />
        </td>
        <td className="px-4 py-3">
            <div className="h-5 w-16 skeleton rounded" />
        </td>
        <td className="px-4 py-3">
            <div className="h-5 w-20 skeleton rounded" />
        </td>
    </tr>
);

// Skeleton for full stock table
export const StockTableSkeleton: FC = () => (
    <div className="glass-card rounded-2xl overflow-hidden animate-pulse">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="h-6 w-40 skeleton rounded" />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="px-4 py-3 text-left">
                            <div className="h-4 w-16 skeleton rounded" />
                        </th>
                        <th className="px-4 py-3 text-left">
                            <div className="h-4 w-12 skeleton rounded" />
                        </th>
                        <th className="px-4 py-3 text-left">
                            <div className="h-4 w-16 skeleton rounded" />
                        </th>
                        <th className="px-4 py-3 text-left">
                            <div className="h-4 w-20 skeleton rounded" />
                        </th>
                        <th className="px-4 py-3 text-left">
                            <div className="h-4 w-16 skeleton rounded" />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {[...Array(5)].map((_, i) => (
                        <TableRowSkeleton key={i} />
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

// Skeleton for dashboard header
export const DashboardHeaderSkeleton: FC = () => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-pulse">
        <div>
            <div className="h-9 w-48 skeleton rounded mb-2" />
            <div className="h-5 w-64 skeleton rounded" />
        </div>
        <div className="h-10 w-48 skeleton rounded-full" />
    </div>
);

// Full dashboard loading skeleton
export const DashboardSkeleton: FC = () => (
    <div className="space-y-8">
        <DashboardHeaderSkeleton />
        <StatsGridSkeleton />

        {/* Section title */}
        <div className="h-6 w-40 skeleton rounded" />

        {/* Sector cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
                <SectorCardSkeleton key={i} />
            ))}
        </div>
    </div>
);

// Sector detail page skeleton
export const SectorDetailSkeleton: FC = () => (
    <div className="space-y-8">
        {/* Back link and header */}
        <div className="animate-pulse">
            <div className="h-5 w-32 skeleton rounded mb-4" />
            <div className="h-9 w-48 skeleton rounded mb-2" />
            <div className="h-5 w-64 skeleton rounded" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="glass-card rounded-xl p-4 text-center animate-pulse">
                    <div className="h-8 w-12 skeleton rounded mx-auto mb-2" />
                    <div className="h-4 w-24 skeleton rounded mx-auto" />
                </div>
            ))}
        </div>

        {/* Table */}
        <StockTableSkeleton />
    </div>
);
