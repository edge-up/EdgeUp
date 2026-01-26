'use client';

import { useState, useEffect } from 'react';

interface AuthStatus {
    isAuthenticated: boolean;
    clientName?: string;
    expiryTime?: string;
    daysUntilExpiry?: number;
    hoursUntilExpiry?: number;
    needsRefresh?: boolean;
    lastRefreshed?: string;
}

export default function DhanSetupPage() {
    const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        checkAuthStatus();

        const params = new URLSearchParams(window.location.search);
        const successParam = params.get('success');
        const errorParam = params.get('error');

        if (successParam === 'true') {
            setSuccess('✅ Successfully connected to Dhan! API authentication is now active.');
            window.history.replaceState({}, '', '/admin/dhan-setup');
        } else if (errorParam) {
            setError(`Authentication failed: ${decodeURIComponent(errorParam)}`);
            window.history.replaceState({}, '', '/admin/dhan-setup');
        }
    }, []);

    const checkAuthStatus = async () => {
        try {
            const response = await fetch('/api/dhan/auth/status');
            const data = await response.json();
            setAuthStatus(data);
        } catch (err) {
            console.error('Failed to check auth status:', err);
            setAuthStatus({ isAuthenticated: false });
        }
    };

    const handleConnectDhan = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('/api/dhan/auth/generate-consent', {
                method: 'POST',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to generate consent (${response.status})`);
            }

            const data = await response.json();

            if (!data.success || !data.loginUrl) {
                throw new Error(data.error || 'Failed to get login URL');
            }

            const width = 600;
            const height = 700;
            const left = (window.screen.width - width) / 2;
            const top = (window.screen.height - height) / 2;

            const popup = window.open(
                data.loginUrl,
                'Dhan Login',
                `width=${width},height=${height},left=${left},top=${top}`
            );

            if (!popup) {
                setError('Please allow popups for this site to complete authentication');
                setLoading(false);
                return;
            }

            const checkPopup = setInterval(() => {
                if (popup.closed) {
                    clearInterval(checkPopup);
                    setLoading(false);
                    setTimeout(() => checkAuthStatus(), 1000);
                }
            }, 500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to initiate authentication');
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect your Dhan account?')) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/dhan/auth/status', {
                method: 'DELETE',
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Disconnected from Dhan successfully');
                checkAuthStatus();
            } else {
                throw new Error(data.error || 'Failed to disconnect');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to disconnect');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Dhan API Authentication
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Connect your Dhan account to enable live market data and trading features
                    </p>
                </div>

                {/* Success Alert */}
                {success && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-500 rounded-lg">
                        <div className="flex items-center gap-2">
                            <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
                            <span className="font-semibold text-green-800 dark:text-green-300">Success</span>
                        </div>
                        <p className="text-green-700 dark:text-green-400 mt-1">{success}</p>
                    </div>
                )}

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-500 rounded-lg">
                        <div className="flex items-center gap-2">
                            <span className="text-red-600 dark:text-red-400 text-lg">✕</span>
                            <span className="font-semibold text-red-800 dark:text-red-300">Error</span>
                        </div>
                        <p className="text-red-700 dark:text-red-400 mt-1">{error}</p>
                    </div>
                )}

                {/* Info Alert */}
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-500 rounded-lg">
                    <div className="flex items-center gap-2">
                        <span className="text-blue-600 dark:text-blue-400 text-lg">ℹ</span>
                        <span className="font-semibold text-blue-800 dark:text-blue-300">
                            About Dhan OAuth Authentication
                        </span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 mt-2 text-blue-700 dark:text-blue-400">
                        <li>API credentials are valid for <strong>12 months</strong></li>
                        <li>No need to manually update tokens daily</li>
                        <li>Secure OAuth-based authentication flow</li>
                        <li>One-time setup with your Dhan credentials</li>
                    </ul>
                </div>

                {/* Connection Status Card */}
                <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Connection Status
                            </h2>
                            {authStatus?.isAuthenticated ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-sm font-medium">
                                    <span>✓</span> Connected
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-sm font-medium">
                                    <span>✕</span> Not Connected
                                </span>
                            )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {authStatus?.isAuthenticated
                                ? 'Your Dhan account is connected and ready to use'
                                : 'Connect your Dhan account to get started'}
                        </p>
                    </div>

                    <div className="p-6 space-y-4">
                        {authStatus?.isAuthenticated ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Account Name</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {authStatus.clientName || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Token Expires In</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {authStatus.daysUntilExpiry} days ({authStatus.hoursUntilExpiry} hours)
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Expiry Date</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {authStatus.expiryTime ? formatDate(authStatus.expiryTime) : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Last Refreshed</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {authStatus.lastRefreshed ? formatDate(authStatus.lastRefreshed) : 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {authStatus.needsRefresh && (
                                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-500 rounded-lg">
                                        <span className="font-semibold text-yellow-800 dark:text-yellow-300">
                                            ⚠️ Refresh Recommended
                                        </span>
                                        <p className="text-yellow-700 dark:text-yellow-400 mt-1">
                                            Your token expires soon. Consider refreshing your connection.
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={handleConnectDhan}
                                        disabled={loading}
                                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                                    >
                                        🔄 Reconnect
                                    </button>
                                    <button
                                        onClick={handleDisconnect}
                                        disabled={loading}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-gray-600 dark:text-gray-400">
                                    Click the button below to connect your Dhan account. You&apos;ll be redirected to
                                    Dhan&apos;s secure login page to authorize this application.
                                </p>
                                <button
                                    onClick={handleConnectDhan}
                                    disabled={loading}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2 text-lg font-medium"
                                >
                                    {loading ? (
                                        <>
                                            <span className="animate-spin">⟳</span> Connecting...
                                        </>
                                    ) : (
                                        <>↗ Connect Dhan Account</>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Setup Instructions Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Setup Instructions
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            First-time setup for Dhan API credentials
                        </p>
                    </div>
                    <div className="p-6">
                        <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300">
                            <li>
                                Go to{' '}
                                <a
                                    href="https://web.dhan.co"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                >
                                    web.dhan.co
                                </a>{' '}
                                and log in to your account
                            </li>
                            <li>Navigate to My Profile → Access DhanHQ APIs</li>
                            <li>Toggle to &quot;API key&quot; section</li>
                            <li>
                                Enter app details:
                                <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-sm">
                                    <li>App Name: EdgeUp Trading Platform</li>
                                    <li>
                                        Redirect URL:{' '}
                                        <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                            {typeof window !== 'undefined'
                                                ? `${window.location.origin}/api/dhan/auth/callback`
                                                : 'http://localhost:3000/api/dhan/auth/callback'}
                                        </code>
                                    </li>
                                </ul>
                            </li>
                            <li>Save your API Key and API Secret</li>
                            <li>
                                Add them to your <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">.env</code>{' '}
                                file:
                                <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded mt-2 text-xs overflow-x-auto">
                                    {`DHAN_API_KEY="your-api-key-here"
DHAN_API_SECRET="your-api-secret-here"
DHAN_CLIENT_ID="your-client-id"
DHAN_REDIRECT_URL="${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/dhan/auth/callback"`}
                                </pre>
                            </li>
                            <li>Restart your development server</li>
                            <li>Click &quot;Connect Dhan Account&quot; above to complete authentication</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}
