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
        <main className="min-h-screen flex flex-col">
            {/* Hero Section */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
                {/* Glowing background effect */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary-500/20 rounded-full blur-[120px]" />
                    <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-bullish-500/10 rounded-full blur-[100px]" />
                    <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] bg-bearish-500/10 rounded-full blur-[80px]" />
                </div>

                {/* Logo and Title */}
                <div className="text-center mb-12 animate-fade-in">
                    <div className="inline-flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/25">
                            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold">
                            <span className="gradient-text">EdgeUp</span>
                        </h1>
                    </div>

                    <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                        Identify <span className="text-bullish-500 font-semibold">early-morning</span> NSE sector momentum
                        and qualifying <span className="text-primary-500 font-semibold">F&O stocks</span> before 9:25 AM IST
                    </p>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mb-12 animate-slide-up">
                    <div className="glass-dark rounded-2xl p-6 text-center card-hover">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-bullish-500/20 flex items-center justify-center">
                            <svg className="w-6 h-6 text-bullish-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Sector Momentum</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Track sectors with ≥1% moves using index-weighted calculations</p>
                    </div>

                    <div className="glass-dark rounded-2xl p-6 text-center card-hover">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary-500/20 flex items-center justify-center">
                            <svg className="w-6 h-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">F&O Filtering</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Only show stocks in the current NSE F&O list</p>
                    </div>

                    <div className="glass-dark rounded-2xl p-6 text-center card-hover">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-bearish-500/20 flex items-center justify-center">
                            <svg className="w-6 h-6 text-bearish-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">9:25 AM Snapshot</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Automatic freeze and persist for daily reference</p>
                    </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 animate-slide-up">
                    <Link
                        href="/login"
                        className="px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300 hover:-translate-y-0.5"
                    >
                        Get Started
                    </Link>
                    <Link
                        href="/register"
                        className="px-8 py-4 glass-dark text-gray-800 dark:text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300"
                    >
                        Create Account
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-6 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800">
                <p>Built for NSE traders seeking an early-morning edge</p>
                <p className="mt-1">Data powered by Dhan API</p>
            </footer>
        </main>
    );
}
