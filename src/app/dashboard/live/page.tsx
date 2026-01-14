import LiveDashboardClient from './LiveDashboardClient';

export const metadata = {
    title: 'Live Market Monitor | EdgeUp',
    description: 'Real-time NSE sector momentum and F&O stock tracking',
};

export default function LiveDashboardPage() {
    return <LiveDashboardClient />;
}
