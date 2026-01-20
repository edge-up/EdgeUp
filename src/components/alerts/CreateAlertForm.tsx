'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface CreateAlertFormProps {
    onSuccess: () => void;
}

interface Sector {
    id: string;
    name: string;
    symbol: string;
}

interface Stock {
    id: string;
    symbol: string;
    name: string;
}

export function CreateAlertForm({ onSuccess }: CreateAlertFormProps) {
    const [alertType, setAlertType] = useState('SECTOR_QUALIFYING');
    const [targetType, setTargetType] = useState('SECTOR');
    const [targetId, setTargetId] = useState('');
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Fetch sectors
    useEffect(() => {
        const fetchSectors = async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/sectors/demo');
                const data = await res.json();
                if (data.success) {
                    setSectors(data.data.sectors || []);
                }
            } catch (error) {
                console.error('Error fetching sectors:', error);
            } finally {
                setLoading(false);
            }
        };

        if (targetType === 'SECTOR') {
            fetchSectors();
        }
    }, [targetType]);

    // Fetch stocks when a sector is selected
    useEffect(() => {
        const fetchStocks = async () => {
            if (!targetId || targetType !== 'STOCK') return;

            try {
                setLoading(true);
                // Get stocks from first sector as example
                const res = await fetch(`/api/sectors/demo/${sectors[0]?.id}/stocks`);
                const data = await res.json();
                if (data.success) {
                    setStocks(data.data || []);
                }
            } catch (error) {
                console.error('Error fetching stocks:', error);
            } finally {
                setLoading(false);
            }
        };

        if (targetType === 'STOCK' && sectors.length > 0) {
            fetchStocks();
        }
    }, [targetType, sectors]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!targetId) {
            toast.error('Please select a target');
            return;
        }

        try {
            setSubmitting(true);
            const res = await fetch('/api/alerts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: alertType,
                    targetType,
                    targetId,
                }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                onSuccess();
            } else {
                toast.error(data.error || 'Failed to create alert');
            }
        } catch (error) {
            console.error('Error creating alert:', error);
            toast.error('Failed to create alert');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Alert Type */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Alert Type
                </label>
                <select
                    value={alertType}
                    onChange={(e) => {
                        setAlertType(e.target.value);
                        // Auto-set target type based on alert type
                        if (e.target.value === 'SECTOR_QUALIFYING') {
                            setTargetType('SECTOR');
                        } else if (e.target.value === 'STOCK_BREAKOUT') {
                            setTargetType('STOCK');
                        }
                    }}
                    className="input-primary"
                >
                    <option value="SECTOR_QUALIFYING">🎯 Sector Qualifying</option>
                    <option value="STOCK_BREAKOUT">📈 Stock Breakout</option>
                    <option value="DAILY_SUMMARY">📊 Daily Summary</option>
                </select>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {alertType === 'SECTOR_QUALIFYING' && 'Get notified when a sector moves ≥1%'}
                    {alertType === 'STOCK_BREAKOUT' && 'Get notified when a stock breaks out with OI surge'}
                    {alertType === 'DAILY_SUMMARY' && 'Get daily snapshot summary at 9:30 AM'}
                </p>
            </div>

            {/* Target Selection */}
            {alertType !== 'DAILY_SUMMARY' && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {targetType === 'SECTOR' ? 'Select Sector' : 'Select Stock'}
                    </label>
                    {loading ? (
                        <div className="input-primary flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                        </div>
                    ) : (
                        <select
                            value={targetId}
                            onChange={(e) => setTargetId(e.target.value)}
                            className="input-primary"
                            required
                        >
                            <option value="">-- Select {targetType === 'SECTOR' ? 'Sector' : 'Stock'} --</option>
                            {targetType === 'SECTOR' && sectors.map((sector) => (
                                <option key={sector.id} value={sector.id}>
                                    {sector.name}
                                </option>
                            ))}
                            {targetType === 'STOCK' && stocks.map((stock) => (
                                <option key={stock.id} value={stock.id}>
                                    {stock.symbol} - {stock.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            )}

            {/* Submit */}
            <div className="flex gap-3">
                <button
                    type="submit"
                    disabled={submitting || (alertType !== 'DAILY_SUMMARY' && !targetId)}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? 'Creating...' : 'Create Alert'}
                </button>
            </div>
        </form>
    );
}
