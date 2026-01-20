'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isActive = (path: string) => pathname === path;

    const navLinks = session ? [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/dashboard/live', label: 'Live Monitor' },
        { href: '/dashboard/history', label: 'History' },
        { href: '/dashboard/alerts', label: 'Alerts' },
    ] : [];

    return (
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md shadow-primary-500/25 group-hover:shadow-lg group-hover:shadow-primary-500/30 transition-shadow">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold gradient-text">EdgeUp</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(link.href)
                                    ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop Auth Section */}
                    <div className="hidden md:flex items-center gap-2">
                        {session ? (
                            <>
                                <ThemeToggle />
                                <NotificationBell />
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                                    <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-semibold">
                                        {session.user.email?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm text-slate-600 dark:text-slate-300 max-w-[150px] truncate">
                                        {session.user.email}
                                    </span>
                                </div>
                                <button
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                    className="btn-ghost text-sm"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="btn-ghost text-sm">
                                    Login
                                </Link>
                                <Link href="/register" className="btn-primary text-sm !py-2">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-slate-200/50 dark:border-slate-700/50 animate-fade-in-down">
                    <div className="px-4 py-4 space-y-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive(link.href)
                                    ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}

                        {/* Mobile Theme Toggle & Notifications */}
                        {session && (
                            <div className="flex items-center gap-2 px-2 py-2">
                                <ThemeToggle />
                                <NotificationBell />
                            </div>
                        )}

                        <div className="divider my-4" />

                        {session ? (
                            <>
                                <div className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">
                                    Signed in as <span className="font-medium text-slate-800 dark:text-white">{session.user.email}</span>
                                </div>
                                <button
                                    onClick={() => { signOut({ callbackUrl: '/' }); setMobileMenuOpen(false); }}
                                    className="w-full px-4 py-3 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-left transition-colors"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <div className="space-y-2 pt-2">
                                <Link
                                    href="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block w-full px-4 py-3 rounded-xl text-sm font-medium text-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block w-full btn-primary text-sm text-center"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
