'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
    const { data: session } = useSession();
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-50 glass-dark border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold gradient-text">EdgeUp</span>
                    </Link>

                    {/* Navigation */}
                    {session ? (
                        <nav className="flex items-center gap-6">
                            <Link
                                href="/dashboard"
                                className={`text-sm font-medium transition-colors ${pathname === '/dashboard'
                                        ? 'text-primary-500'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-primary-500'
                                    }`}
                            >
                                Dashboard
                            </Link>
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {session.user.email}
                                </span>
                                <button
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                    className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-bearish-500 transition-colors"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </nav>
                    ) : (
                        <nav className="flex items-center gap-4">
                            <Link
                                href="/login"
                                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
                            >
                                Get Started
                            </Link>
                        </nav>
                    )}
                </div>
            </div>
        </header>
    );
}
