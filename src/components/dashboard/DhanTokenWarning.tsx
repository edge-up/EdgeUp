'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AuthStatus {
    isAuthenticated: boolean;
    hoursUntilExpiry?: number;
    needsRefresh?: boolean;
}

export function DhanTokenWarning() {
    const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check auth status on dashboard load
        fetch('/api/dhan/auth/status')
            .then((res) => res.json())
            .then((data) => setAuthStatus(data))
            .catch((err) => console.error('Failed to check Dhan auth:', err));
    }, []);

    // Don't show if dismissed or not needed
    if (dismissed || !authStatus?.needsRefresh || !authStatus?.isAuthenticated) {
        return null;
    }

    const isUrgent = (authStatus.hoursUntilExpiry ?? 0) < 6;

    return (
        <div
            className={`fixed top-0 left-0 right-0 z-50 ${isUrgent ? 'bg-red-600' : 'bg-yellow-600'
                } text-white px-4 py-3 shadow-lg`}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{isUrgent ? '🚨' : '⚠️'}</span>
                    <div>
                        <p className="font-semibold">
                            {isUrgent ? 'Urgent: ' : ''}Dhan API Token Expires Soon
                        </p>
                        <p className="text-sm opacity-90">
                            Your token expires in {authStatus.hoursUntilExpiry} hours. Refresh now to avoid API failures.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/dhan-setup"
                        className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                    >
                        Refresh Token
                    </Link>
                    <button
                        onClick={() => setDismissed(true)}
                        className="text-white hover:text-gray-200 text-2xl leading-none"
                        aria-label="Dismiss"
                    >
                        ×
                    </button>
                </div>
            </div>
        </div>
    );
}
