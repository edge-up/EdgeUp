'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DhanStatus {
    isAuthenticated: boolean;
    hoursUntilExpiry?: number;
    needsRefresh?: boolean;
}

export function DhanStatusIndicator() {
    const [status, setStatus] = useState<DhanStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkStatus();
        // Refresh status every 5 minutes
        const interval = setInterval(checkStatus, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const checkStatus = async () => {
        try {
            const res = await fetch('/api/dhan/auth/status');
            const data = await res.json();
            setStatus(data);
        } catch (err) {
            console.error('Failed to check Dhan status:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Dhan</span>
            </div>
        );
    }

    if (!status?.isAuthenticated) {
        return (
            <Link
                href="/admin/dhan-setup"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                title="Dhan API not connected. Click to setup."
            >
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs font-medium text-red-700 dark:text-red-400">Dhan</span>
            </Link>
        );
    }

    // Determine status color
    const isUrgent = (status.hoursUntilExpiry ?? 0) < 6;
    const isWarning = (status.hoursUntilExpiry ?? 0) < 12;

    const statusColor = isUrgent
        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
        : isWarning
            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400'
            : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400';

    const dotColor = isUrgent
        ? 'bg-red-500'
        : isWarning
            ? 'bg-yellow-500'
            : 'bg-green-500';

    return (
        <Link
            href="/admin/dhan-setup"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors hover:opacity-80 ${statusColor}`}
            title={`Dhan API: ${status.hoursUntilExpiry}h remaining. Click to ${status.needsRefresh ? 'refresh' : 'manage'}.`}
        >
            <div className={`w-2 h-2 rounded-full ${dotColor} ${isWarning ? 'animate-pulse' : ''}`} />
            <span className="text-xs font-medium">
                Dhan {status.hoursUntilExpiry}h
            </span>
        </Link>
    );
}
