'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { AlertCard } from '@/components/alerts/AlertCard';
import { CreateAlertForm } from '@/components/alerts/CreateAlertForm';

interface Alert {
    id: string;
    type: string;
    targetType: string;
    targetId: string;
    isActive: boolean;
    createdAt: string;
    target?: {
        name: string;
        symbol?: string;
    };
}

export default function AlertsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchAlerts();
        }
    }, [status]);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/alerts');
            const data = await res.json();

            if (data.success) {
                setAlerts(data.data);
            } else {
                toast.error('Failed to load alerts');
            }
        } catch (error) {
            console.error('Error fetching alerts:', error);
            toast.error('Failed to load alerts');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (alertId: string, isActive: boolean) => {
        try {
            const res = await fetch(`/api/alerts/${alertId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive }),
            });

            if (res.ok) {
                toast.success(isActive ? 'Alert activated' : 'Alert deactivated');
                fetchAlerts();
            } else {
                toast.error('Failed to update alert');
            }
        } catch (error) {
            console.error('Error toggling alert:', error);
            toast.error('Failed to update alert');
        }
    };

    const handleDelete = async (alertId: string) => {
        if (!confirm('Are you sure you want to delete this alert?')) return;

        try {
            const res = await fetch(`/api/alerts/${alertId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success('Alert deleted');
                fetchAlerts();
            } else {
                toast.error('Failed to delete alert');
            }
        } catch (error) {
            console.error('Error deleting alert:', error);
            toast.error('Failed to delete alert');
        }
    };

    const handleAlertCreated = () => {
        setShowCreateForm(false);
        fetchAlerts();
        toast.success('Alert created successfully!');
    };

    if (status === 'loading' || loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                        My Alerts
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Get notified when sectors qualify or stocks break out
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="btn-primary"
                >
                    {showCreateForm ? '✕ Cancel' : '+ New Alert'}
                </button>
            </div>

            {/* Create Alert Form */}
            {showCreateForm && (
                <div className="glass-card rounded-2xl p-6">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                        Create New Alert
                    </h2>
                    <CreateAlertForm onSuccess={handleAlertCreated} />
                </div>
            )}

            {/* Alerts List */}
            {alerts.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                        No Alerts Yet
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                        Create your first alert to get notified when sectors qualify or stocks break out.
                    </p>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="btn-primary"
                    >
                        Create Your First Alert
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {alerts.map((alert) => (
                        <AlertCard
                            key={alert.id}
                            alert={alert}
                            onToggleActive={handleToggleActive}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
