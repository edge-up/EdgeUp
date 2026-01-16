import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Providers } from '@/components/providers';
import { Header } from '@/components/ui/Header';
import { MarketStatusBanner } from '@/components/MarketStatusBanner';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    return (
        <Providers>
            <div className="min-h-screen">
                <Header />
                <MarketStatusBanner />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                </main>
            </div>
        </Providers>
    );
}
