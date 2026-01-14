'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Registration failed');
                return;
            }

            // Redirect to login on success
            router.push('/login?registered=true');
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center px-4 py-12">
            {/* Background effects */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary-500/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-emerald-500/15 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-md animate-fade-in-up">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 group">
                        <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-shadow">
                            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold gradient-text">EdgeUp</span>
                    </Link>
                </div>

                {/* Register Card */}
                <div className="glass-card rounded-2xl p-8">
                    <h1 className="text-2xl font-bold text-center mb-2 text-slate-800 dark:text-white">
                        Create Account
                    </h1>
                    <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-6">
                        Join EdgeUp and get your trading edge
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-3">
                                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Full Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input-primary"
                                placeholder="John Doe"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="input-primary"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    className="input-primary pr-12"
                                    placeholder="Min 8 characters"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                Must be at least 8 characters
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary justify-center"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Creating account...
                                </span>
                            ) : (
                                'Create Account'
                            )}
                        </button>

                        {/* Terms notice */}
                        <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                            By creating an account, you agree to our{' '}
                            <span className="text-primary-500">Terms of Service</span> and{' '}
                            <span className="text-primary-500">Privacy Policy</span>
                        </p>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary-500 hover:text-primary-400 font-semibold transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>

                {/* Demo link */}
                <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    Want to explore first?{' '}
                    <Link href="/dashboard/demo" className="text-primary-500 hover:text-primary-400 font-medium transition-colors">
                        View Demo →
                    </Link>
                </p>
            </div>
        </main>
    );
}
