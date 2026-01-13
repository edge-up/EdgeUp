'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { StockTable } from '@/components/dashboard/StockTable';
import { SnapshotStatus } from '@/components/dashboard/SnapshotStatus';
import { SectorData, StockData } from '@/types';

interface SectorStocksResponse {
    success: boolean;
    data: {
        sector: SectorData;
        stocks: StockData[];
        snapshotTime: string | null;
        isFrozen: boolean;
        tradingDate?: string;
        timestamp?: string;
    };
}

export default function DemoSectorDetailPage() {
    const params = useParams();
    const sectorId = params.sectorId as string;

    const [data, setData] = useState<SectorStocksResponse['data'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/sectors/demo/${sectorId}/stocks`);
            const json: SectorStocksResponse = await res.json();

            if (!json.success) {
                throw new Error(json.error || 'Failed to fetch demo stocks');
            }

            setData(json.data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [sectorId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">Loading stocks...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-dark rounded-2xl p-8 text-center">
                <p className="text-bearish-500 mb-4">{error}</p>
                <Link href="/dashboard/demo" className="text-primary-500 hover:text-primary-400">
                    ← Back to Demo Dashboard
                </Link>
            </div>
        );
    }

    const sector = data?.sector;
    const stocks = data?.stocks || [];
    const isUp = stocks.length > 0 ? stocks[0].direction === 'UP' : true;

    return (
        <div className="space-y-6">
            {/* Demo Banner */}
            <div className="glass-dark rounded-xl p-4 border border-primary-500/30">
                <div className="flex items-center gap-2 text-sm">
                    <span>🎭</span>
                    <span className="text-gray-600 dark:text-gray-400">Demo Mode - Sample stock data</span>
                    <Link href="/dashboard/demo" className="ml-auto text-primary-500 hover:text-primary-400">
                        ← Back to Demo Dashboard
                    </Link>
                </div>
            </div>

            {/* Sector Header */}
            <div className="glass-dark rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                                {sector?.name}
                            </h1>
                            <span className={`
                px-3 py-1 rounded-full text-sm font-medium
                ${isUp ? 'bullish-badge' : 'bearish-badge'}
              `}>
                                {isUp ? '↑ UP' : '↓ DOWN'}
                            </span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">
                            {sector?.symbol} • {stocks.length} qualifying F&O stocks
                        </p>
                    </div>

                    <SnapshotStatus
                        isFrozen={data?.isFrozen || false}
                        snapshotTime={data?.snapshotTime}
                        tradingDate={data?.tradingDate}
                    />
                </div>
            </div>

            {/* Stocks Table */}
            <StockTable stocks={stocks} sectorName={sector?.name} />

            {/* Footer Note */}
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Demo data updates every 5 seconds • Last updated: {data?.timestamp}
            </p>
        </div>
    );
}
