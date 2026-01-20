import { cn } from '@/lib/utils/cn';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
}

/**
 * Base Skeleton component for loading states
 * Provides a pulse animation while content is loading
 */
export function Skeleton({
    className,
    variant = 'rectangular',
    width,
    height,
}: SkeletonProps) {
    const baseStyles = 'animate-pulse bg-slate-200 dark:bg-slate-800';

    const variantStyles = {
        text: 'h-4 rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
    };

    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    return (
        <div
            className={cn(baseStyles, variantStyles[variant], className)}
            style={style}
        />
    );
}

/**
 * Sector Card Skeleton
 */
export function SectorCardSkeleton() {
    return (
        <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton variant="text" width={120} height={24} />
                <Skeleton variant="circular" width={40} height={40} />
            </div>
            <div className="space-y-2">
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton variant="text" width="40%" height={16} />
            </div>
            <div className="flex gap-2">
                <Skeleton variant="rectangular" width={80} height={32} />
                <Skeleton variant="rectangular" width={80} height={32} />
            </div>
        </div>
    );
}

/**
 * Stock Table Skeleton
 */
export function StockTableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="glass-card rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <Skeleton variant="text" width={150} height={20} />
            </div>

            {/* Table */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="p-4 flex items-center gap-4">
                        <Skeleton variant="rectangular" width={4} height={32} />
                        <Skeleton variant="text" width={100} height={20} />
                        <div className="ml-auto flex gap-4">
                            <Skeleton variant="text" width={80} height={20} />
                            <Skeleton variant="text" width={60} height={20} />
                            <Skeleton variant="rectangular" width={80} height={28} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Chart Skeleton
 */
export function ChartSkeleton({ height = 300 }: { height?: number }) {
    return (
        <div className="glass-card rounded-2xl p-6">
            <div className="space-y-4">
                <Skeleton variant="text" width={120} height={20} />
                <Skeleton variant="rectangular" width="100%" height={height} />
            </div>
        </div>
    );
}

/**
 * Card Skeleton
 */
export function CardSkeleton() {
    return (
        <div className="glass-card rounded-2xl p-6 space-y-4">
            <Skeleton variant="text" width="70%" height={24} />
            <Skeleton variant="text" width="100%" height={16} />
            <Skeleton variant="text" width="90%" height={16} />
            <Skeleton variant="rectangular" width="100%" height={120} />
        </div>
    );
}
