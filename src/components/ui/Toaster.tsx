'use client';

import { Toaster as HotToaster } from 'react-hot-toast';

/**
 * Toast notification provider
 * Wraps react-hot-toast with custom styling
 */
export function Toaster() {
    return (
        <HotToaster
            position="top-right"
            toastOptions={{
                // Default options
                duration: 4000,
                style: {
                    background: 'var(--toast-bg)',
                    color: 'var(--toast-text)',
                    border: '1px solid var(--toast-border)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                },
                // Success
                success: {
                    iconTheme: {
                        primary: '#10B981',
                        secondary: '#fff',
                    },
                    style: {
                        background: '#ECFDF5',
                        color: '#065F46',
                        border: '1px solid #A7F3D0',
                    },
                },
                // Error
                error: {
                    iconTheme: {
                        primary: '#EF4444',
                        secondary: '#fff',
                    },
                    style: {
                        background: '#FEF2F2',
                        color: '#991B1B',
                        border: '1px solid #FECACA',
                    },
                },
                // Loading
                loading: {
                    iconTheme: {
                        primary: '#6366F1',
                        secondary: '#fff',
                    },
                },
            }}
        />
    );
}
