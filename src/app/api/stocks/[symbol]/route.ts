import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { getDhanClient } from '@/lib/dhan/dhan-client';

/**
 * GET /api/stocks/[symbol]
 * Get stock details with historical data
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { symbol } = await params;
        const upperSymbol = symbol.toUpperCase();

        // Get stock from database
        const stock = await prisma.stock.findUnique({
            where: { symbol: upperSymbol },
            include: {
                sectors: {
                    include: {
                        sector: {
                            select: { id: true, name: true, symbol: true }
                        }
                    }
                }
            }
        });

        if (!stock) {
            return NextResponse.json(
                { success: false, error: 'Stock not found' },
                { status: 404 }
            );
        }

        const dhanClient = getDhanClient();

        // Get current quote
        let currentQuote = null;
        if (stock.dhanSecurityId) {
            try {
                const quotes = await dhanClient.getQuotes([stock.dhanSecurityId]);
                currentQuote = quotes[0] || null;
            } catch (e) {
                console.warn('Failed to fetch current quote:', e);
            }
        }

        // Get historical data (last 30 days)
        let historicalData: { date: string; open: number; high: number; low: number; close: number; volume: number }[] = [];

        if (stock.dhanSecurityId) {
            try {
                const toDate = new Date();
                const fromDate = new Date();
                fromDate.setDate(fromDate.getDate() - 30);

                // Fetch last 30 trading days of intraday data
                // Note: This is a simplified approach - in production you'd want daily OHLC
                const data = await dhanClient.getHistoricalData(
                    stock.dhanSecurityId,
                    fromDate,
                    toDate,
                    'NSE_EQ'
                );

                if (data && data.length > 0) {
                    // Group by date and aggregate to daily OHLC
                    const dailyData = new Map<string, { open: number; high: number; low: number; close: number; volume: number }>();

                    data.forEach(candle => {
                        const date = candle.timestamp.split('T')[0];
                        const existing = dailyData.get(date);

                        if (!existing) {
                            dailyData.set(date, {
                                open: candle.open,
                                high: candle.high,
                                low: candle.low,
                                close: candle.close,
                                volume: candle.volume
                            });
                        } else {
                            dailyData.set(date, {
                                open: existing.open, // Keep first open
                                high: Math.max(existing.high, candle.high),
                                low: Math.min(existing.low, candle.low),
                                close: candle.close, // Keep last close
                                volume: existing.volume + candle.volume
                            });
                        }
                    });

                    historicalData = Array.from(dailyData.entries())
                        .map(([date, ohlc]) => ({ date, ...ohlc }))
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                }
            } catch (e) {
                console.warn('Failed to fetch historical data:', e);
            }
        }

        // Get recent OI history from snapshots
        const oiHistory = await prisma.stockSnapshot.findMany({
            where: { stockId: stock.id },
            orderBy: { createdAt: 'desc' },
            take: 30,
            select: {
                createdAt: true,
                openInterest: true,
                previousOI: true,
                ltp: true,
                percentChange: true
            }
        });

        const formattedOiHistory = oiHistory.map(snap => ({
            date: snap.createdAt.toISOString().split('T')[0],
            oi: snap.openInterest ? Number(snap.openInterest) : null,
            previousOI: snap.previousOI ? Number(snap.previousOI) : null,
            oiChange: snap.openInterest && snap.previousOI
                ? ((Number(snap.openInterest) - Number(snap.previousOI)) / Number(snap.previousOI)) * 100
                : null,
            ltp: snap.ltp,
            priceChange: snap.percentChange
        })).reverse();

        const sectors = stock.sectors.map((sc: { sector: { id: string; name: string; symbol: string } }) => sc.sector);

        return NextResponse.json({
            success: true,
            data: {
                stock: {
                    id: stock.id,
                    symbol: stock.symbol,
                    name: stock.name,
                    isin: stock.isin,
                    industry: stock.industry,
                    isFOEligible: stock.isFOEligible,
                    lotSize: stock.lotSize,
                    sectors
                },
                currentQuote: currentQuote ? {
                    ltp: currentQuote.ltp,
                    open: currentQuote.open,
                    high: currentQuote.high,
                    low: currentQuote.low,
                    previousClose: currentQuote.previousClose,
                    change: currentQuote.change,
                    changePercent: currentQuote.changePercent,
                    volume: currentQuote.volume,
                    openInterest: currentQuote.openInterest
                } : null,
                historicalData,
                oiHistory: formattedOiHistory
            }
        });
    } catch (error) {
        console.error('GET /api/stocks/[symbol] error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch stock data' },
            { status: 500 }
        );
    }
}
