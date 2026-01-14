'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/dashboard');
        }
    }, [status, router]);

    // Show loading while checking auth
    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen flex flex-col relative overflow-hidden">
            {/* Animated background effects */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary-500/20 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-emerald-500/15 rounded-full blur-[100px] animate-float" />
                <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] bg-rose-500/15 rounded-full blur-[80px] animate-float" style={{ animationDelay: '1s' }} />

                {/* Grid pattern overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            {/* Hero Section */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
                {/* Logo and Title */}
                <div className="text-center mb-12 animate-fade-in">
                    <div className="inline-flex items-center gap-3 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/30 animate-bounce-subtle">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold">
                            <span className="gradient-text">EdgeUp</span>
                        </h1>
                    </div>

                    <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        Identify <span className="text-emerald-500 font-semibold">early-morning</span> NSE sector momentum
                        and qualifying <span className="text-primary-500 font-semibold">F&O stocks</span> before 9:25 AM IST
                    </p>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mb-12">
                    {[
                        {
                            icon: (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            ),
                            title: 'Sector Momentum',
                            description: 'Track sectors with ≥1% moves using index-weighted calculations',
                            color: 'emerald',
                        },
                        {
                            icon: (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            ),
                            title: 'F&O + OI Filtering',
                            description: 'Show stocks with ≥7% Open Interest change',
                            color: 'primary',
                        },
                        {
                            icon: (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ),
                            title: '9:25 AM Snapshot',
                            description: 'Automatic freeze and persist for daily reference',
                            color: 'rose',
                        },
                    ].map((feature, index) => (
                        <div
                            key={feature.title}
                            className="glass-card rounded-2xl p-6 text-center card-hover animate-fade-in-up"
                            style={{ animationDelay: `${(index + 1) * 100}ms` }}
                        >
                            <div className={`w-14 h-14 mx-auto mb-4 rounded-xl bg-${feature.color}-500/15 flex items-center justify-center text-${feature.color}-500`}>
                                {feature.icon}
                            </div>
                            <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-white">{feature.title}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
                        </div>
                    ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                    <Link href="/login" className="btn-primary text-center">
                        Get Started
                    </Link>
                    <Link
                        href="/register"
                        className="btn-secondary text-center"
                    >
                        Create Account
                    </Link>
                </div>

                {/* Trust indicators */}
                <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400 animate-fade-in" style={{ animationDelay: '500ms' }}>
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Real-time NSE data</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Open Interest tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Powered by Dhan API</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-8 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50">
                <p className="font-medium">Built for NSE traders seeking an early-morning edge</p>
                <p className="mt-1 text-slate-400 dark:text-slate-500">© 2026 EdgeUp. All rights reserved.</p>
            </footer>
        </main>
    );
}
