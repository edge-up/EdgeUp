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
            inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full text-sm font-medium
            transition-all duration-300
            ${isFrozen
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-sm shadow-emerald-500/10'
                : 'bg-primary-500/15 text-primary-600 dark:text-primary-400 border border-primary-500/25 shadow-sm shadow-primary-500/10'
            }
        `}>
            {isFrozen ? (
                <>
                    {/* Lock icon */}
                    <div className="relative">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <span className="font-semibold">
                        Snapshot
                        {snapshotTime && <span className="font-normal"> at {formatTime(snapshotTime)}</span>}
                        {tradingDate && <span className="font-normal text-emerald-500/70"> • {formatDate(tradingDate)}</span>}
                    </span>
                </>
            ) : (
                <>
                    {/* Live pulse */}
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-500"></span>
                    </span>
                    <span className="font-semibold">Live Data</span>
                    <span className="text-primary-500/70">• Snapshot at 09:30 AM</span>
                </>
            )}
        </div>
    );
}
