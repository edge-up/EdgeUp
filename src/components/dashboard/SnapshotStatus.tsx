interface SnapshotStatusProps {
    isFrozen: boolean;
    snapshotTime?: string | null;
    tradingDate?: string;
}

export function SnapshotStatus({ isFrozen, snapshotTime, tradingDate }: SnapshotStatusProps) {
    const formatTime = (isoString: string) => {
        // The database stores time in IST but without timezone info
        // When parsing, we need to treat it as IST, not UTC
        const date = new Date(isoString);
        // Extract UTC components which actually represent IST
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        const ampm = hours >= 12 ? 'pm' : 'am';
        const displayHours = hours % 12 || 12;
        return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            timeZone: 'Asia/Kolkata',
        });
    };

    return (
        <div className={`
      inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
      ${isFrozen
                ? 'bg-bullish-500/20 text-bullish-600 dark:text-bullish-500 border border-bullish-500/30'
                : 'bg-primary-500/20 text-primary-600 dark:text-primary-400 border border-primary-500/30'
            }
    `}>
            {isFrozen ? (
                <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>
                        Snapshot Frozen
                        {snapshotTime && ` at ${formatTime(snapshotTime)}`}
                        {tradingDate && ` • ${formatDate(tradingDate)}`}
                    </span>
                </>
            ) : (
                <>
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                    </span>
                    <span>Live Data • Snapshot at 09:25 AM</span>
                </>
            )}
        </div>
    );
}
