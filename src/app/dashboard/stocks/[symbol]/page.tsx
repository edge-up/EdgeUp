import { getStockEngine } from '@/lib/engines/stock-engine';
import { notFound } from 'next/navigation';
import StockDetailClient from './StockDetailClient';
import { Metadata } from 'next';

interface StockPageProps {
    params: {
        symbol: string;
    };
}

export async function generateMetadata({ params }: StockPageProps): Promise<Metadata> {
    return {
        title: `${params.symbol.toUpperCase()} | EdgeUp Analytics`,
        description: `Detailed momentum analysis and OI data for ${params.symbol.toUpperCase()}`,
    };
}

export default async function StockPage({ params }: StockPageProps) {
    const symbol = params.symbol.toUpperCase();
    const stockEngine = getStockEngine();

    const stock = await stockEngine.getStockBySymbol(symbol);

    if (!stock) {
        notFound();
    }

    return (
        <div className="container mx-auto">
            <StockDetailClient stock={stock} />
        </div>
    );
}
