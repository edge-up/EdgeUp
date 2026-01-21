'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';

interface AdvancedChartProps {
    symbol: string;
    ohlcData: Array<{
        timestamp: string;
        open: number;
        high: number;
        low: number;
        close: number;
        volume?: number;
    }>;
    oiHistory?: Array<{
        timestamp: string;
        openInterest: number;
    }>;
    currentPrice: number;
    previousClose: number;
}

type ChartType = 'candlestick' | 'line' | 'area';
type Timeframe = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y';
type Indicator = 'MA20' | 'MA50' | 'VOLUME' | 'OI';

export function AdvancedStockChart({
    symbol,
    ohlcData,
    oiHistory,
    currentPrice,
    previousClose
}: AdvancedChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const mainSeriesRef = useRef<ISeriesApi<'Candlestick' | 'Line' | 'Area'> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

    const [chartType, setChartType] = useState<ChartType>('candlestick');
    const [timeframe, setTimeframe] = useState<Timeframe>('1D');
    const [activeIndicators, setActiveIndicators] = useState<Set<Indicator>>(new Set(['VOLUME' as Indicator]));
    const [isLoading, setIsLoading] = useState(false);

    // Calculate technical indicators
    const calculateMA = (data: CandlestickData[], period: number) => {
        const maData: Array<{ time: Time; value: number }> = [];
        for (let i = period - 1; i < data.length; i++) {
            const sum = data.slice(i - period + 1, i + 1).reduce((acc, d) => acc + d.close, 0);
            maData.push({
                time: data[i].time,
                value: sum / period
            });
        }
        return maData;
    };

    useEffect(() => {
        if (!chartContainerRef.current || ohlcData.length === 0) return;

        // Create or update chart
        if (!chartRef.current) {
            const chart = createChart(chartContainerRef.current, {
                width: chartContainerRef.current.clientWidth,
                height: 500,
                layout: {
                    background: { color: 'transparent' },
                    textColor: '#9ca3af',
                },
                grid: {
                    vertLines: { color: 'rgba(148, 163, 184, 0.1)' },
                    horzLines: { color: 'rgba(148, 163, 184, 0.1)' },
                },
                crosshair: {
                    mode: 1,
                    vertLine: {
                        color: '#6366f1',
                        width: 1,
                        style: 3,
                        labelBackgroundColor: '#6366f1',
                    },
                    horzLine: {
                        color: '#6366f1',
                        width: 1,
                        style: 3,
                        labelBackgroundColor: '#6366f1',
                    },
                },
                timeScale: {
                    borderColor: 'rgba(148, 163, 184, 0.2)',
                    timeVisible: true,
                    secondsVisible: false,
                },
                rightPriceScale: {
                    borderColor: 'rgba(148, 163, 184, 0.2)',
                },
            });

            chartRef.current = chart;
        }

        const chart = chartRef.current;

        // Clear existing series
        if (mainSeriesRef.current) {
            chart.removeSeries(mainSeriesRef.current as any);
        }
        if (volumeSeriesRef.current) {
            chart.removeSeries(volumeSeriesRef.current);
        }

        // Prepare data
        const chartData: CandlestickData[] = ohlcData.map(d => ({
            time: (new Date(d.timestamp).getTime() / 1000) as Time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
        }));

        // Add main series based on chart type
        if (chartType === 'candlestick') {
            const candlestickSeries = chart.addCandlestickSeries({
                upColor: '#10b981',
                downColor: '#ef4444',
                borderUpColor: '#10b981',
                borderDownColor: '#ef4444',
                wickUpColor: '#10b981',
                wickDownColor: '#ef4444',
            });
            candlestickSeries.setData(chartData);
            mainSeriesRef.current = candlestickSeries as any;
        } else if (chartType === 'line') {
            const lineSeries = chart.addLineSeries({
                color: '#6366f1',
                lineWidth: 2,
            });
            const lineData = chartData.map(d => ({
                time: d.time,
                value: d.close,
            }));
            lineSeries.setData(lineData);
            mainSeriesRef.current = lineSeries as any;
        } else if (chartType === 'area') {
            const areaSeries = chart.addAreaSeries({
                topColor: 'rgba(99, 102, 241, 0.4)',
                bottomColor: 'rgba(99, 102, 241, 0.0)',
                lineColor: '#6366f1',
                lineWidth: 2,
            });
            const areaData = chartData.map(d => ({
                time: d.time,
                value: d.close,
            }));
            areaSeries.setData(areaData);
            mainSeriesRef.current = areaSeries as any;
        }

        // Add volume if enabled
        if (activeIndicators.has('VOLUME') && ohlcData.some(d => d.volume)) {
            const volumeSeries = chart.addHistogramSeries({
                color: '#94a3b8',
                priceFormat: {
                    type: 'volume',
                },
                priceScaleId: 'volume',
            });

            const volumeData = ohlcData.map(d => ({
                time: (new Date(d.timestamp).getTime() / 1000) as Time,
                value: d.volume || 0,
                color: d.close >= d.open ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)',
            }));

            volumeSeries.setData(volumeData);
            volumeSeriesRef.current = volumeSeries;

            chart.priceScale('volume').applyOptions({
                scaleMargins: {
                    top: 0.8,
                    bottom: 0,
                },
            });
        }

        // Add moving averages if enabled
        if (activeIndicators.has('MA20')) {
            const ma20Series = chart.addLineSeries({
                color: '#f59e0b',
                lineWidth: 1,
                priceLineVisible: false,
            });
            ma20Series.setData(calculateMA(chartData, 20));
        }

        if (activeIndicators.has('MA50')) {
            const ma50Series = chart.addLineSeries({
                color: '#8b5cf6',
                lineWidth: 1,
                priceLineVisible: false,
            });
            ma50Series.setData(calculateMA(chartData, 50));
        }

        // Fit content
        chart.timeScale().fitContent();

        // Handle resize
        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [ohlcData, chartType, activeIndicators, timeframe]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, []);

    const toggleIndicator = (indicator: Indicator) => {
        setActiveIndicators(prev => {
            const newSet = new Set(prev);
            if (newSet.has(indicator)) {
                newSet.delete(indicator);
            } else {
                newSet.add(indicator);
            }
            return newSet;
        });
    };

    const percentChange = ((currentPrice - previousClose) / previousClose) * 100;
    const isPositive = percentChange >= 0;

    return (
        <div className="space-y-4">
            {/* Chart Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                        {symbol}
                    </h2>
                    <div className="flex items-baseline gap-3 mt-1">
                        <span className="text-3xl font-bold text-slate-800 dark:text-white">
                            ₹{currentPrice.toFixed(2)}
                        </span>
                        <span className={`text-lg font-semibold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isPositive ? '+' : ''}{percentChange.toFixed(2)}%
                        </span>
                    </div>
                </div>

                {/* Timeframe Selector */}
                <div className="flex flex-wrap gap-2">
                    {(['1D', '5D', '1M', '3M', '6M', '1Y'] as Timeframe[]).map(tf => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${timeframe === tf
                                ? 'bg-primary-500 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart Controls */}
            <div className="flex flex-wrap items-center gap-4">
                {/* Chart Type */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setChartType('candlestick')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${chartType === 'candlestick'
                            ? 'bg-slate-800 dark:bg-slate-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        title="Candlestick Chart"
                    >
                        📊
                    </button>
                    <button
                        onClick={() => setChartType('line')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${chartType === 'line'
                            ? 'bg-slate-800 dark:bg-slate-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        title="Line Chart"
                    >
                        📈
                    </button>
                    <button
                        onClick={() => setChartType('area')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${chartType === 'area'
                            ? 'bg-slate-800 dark:bg-slate-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        title="Area Chart"
                    >
                        📉
                    </button>
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-slate-300 dark:bg-slate-600"></div>

                {/* Indicators */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => toggleIndicator('MA20')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeIndicators.has('MA20')
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        MA20
                    </button>
                    <button
                        onClick={() => toggleIndicator('MA50')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeIndicators.has('MA50')
                            ? 'bg-purple-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        MA50
                    </button>
                    <button
                        onClick={() => toggleIndicator('VOLUME')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeIndicators.has('VOLUME')
                            ? 'bg-slate-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        Volume
                    </button>
                </div>
            </div>

            {/* Chart Container */}
            <div className="glass-card rounded-2xl p-4 overflow-hidden">
                {isLoading ? (
                    <div className="h-[500px] flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                    </div>
                ) : (
                    <div ref={chartContainerRef} className="w-full" />
                )}
            </div>

            {/* Legend */}
            {activeIndicators.size > 0 && (
                <div className="flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-400">
                    {activeIndicators.has('MA20') && (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-0.5 bg-amber-500"></div>
                            <span>MA 20</span>
                        </div>
                    )}
                    {activeIndicators.has('MA50') && (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-0.5 bg-purple-500"></div>
                            <span>MA 50</span>
                        </div>
                    )}
                    {activeIndicators.has('VOLUME') && (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-2 bg-slate-400"></div>
                            <span>Volume</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
