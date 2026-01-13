'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f9fafb',
                    padding: '1rem',
                }}>
                    <div style={{
                        maxWidth: '28rem',
                        width: '100%',
                        textAlign: 'center',
                    }}>
                        <h1 style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#1f2937',
                            marginBottom: '0.5rem',
                        }}>
                            Something went wrong
                        </h1>

                        <p style={{
                            color: '#6b7280',
                            marginBottom: '1.5rem',
                        }}>
                            {error.message || 'An unexpected error occurred'}
                        </p>

                        <button
                            onClick={reset}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
