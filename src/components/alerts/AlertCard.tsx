interface AlertCardProps {
    alert: {
        id: string;
        type: string;
        targetType: string;
        isActive: boolean;
        createdAt: string;
        target?: {
            name: string;
            symbol?: string;
        };
    };
    onToggleActive: (alertId: string, isActive: boolean) => void;
    onDelete: (alertId: string) => void;
}

export function AlertCard({ alert, onToggleActive, onDelete }: AlertCardProps) {
    const getAlertIcon = () => {
        switch (alert.type) {
            case 'SECTOR_QUALIFYING':
                return '🎯';
            case 'STOCK_BREAKOUT':
                return '📈';
            case 'DAILY_SUMMARY':
                return '📊';
            default:
                return '🔔';
        }
    };

    const getAlertLabel = () => {
        switch (alert.type) {
            case 'SECTOR_QUALIFYING':
                return 'Sector Qualifying';
            case 'STOCK_BREAKOUT':
                return 'Stock Breakout';
            case 'DAILY_SUMMARY':
                return 'Daily Summary';
            default:
                return alert.type;
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="glass-card rounded-2xl p-6 space-y-4 hover:shadow-lg transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="text-3xl">{getAlertIcon()}</div>
                    <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white">
                            {alert.target?.name || alert.target?.symbol || 'Unknown'}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {getAlertLabel()}
                        </p>
                    </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${alert.isActive
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-500/15 text-slate-600 dark:text-slate-400'
                    }`}>
                    {alert.isActive ? 'Active' : 'Inactive'}
                </div>
            </div>

            {/* Meta */}
            <div className="text-sm text-slate-500 dark:text-slate-400">
                Created {formatDate(alert.createdAt)}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => onToggleActive(alert.id, !alert.isActive)}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                    {alert.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                    onClick={() => onDelete(alert.id)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                >
                    Delete
                </button>
            </div>
        </div>
    );
}
