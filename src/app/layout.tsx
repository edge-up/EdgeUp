import type { Metadata } from 'next'
import { Providers } from '@/components/providers'
import './globals.css'

export const metadata: Metadata = {
    title: 'EdgeUp | NSE Momentum Analytics',
    description: 'Identify early-morning NSE sector momentum and qualifying F&O stocks before 9:30 AM IST',
    keywords: ['NSE', 'stock market', 'momentum', 'F&O', 'intraday', 'sector analysis'],
    authors: [{ name: 'EdgeUp' }],
    viewport: 'width=device-width, initial-scale=1',
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#0f0f11' },
    ],
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="antialiased">
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    )
}
