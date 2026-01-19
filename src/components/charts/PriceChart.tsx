'use client';

import { useEffect, useRef } from 'react';
import { createChart, IChartApi, CandlestickData, Time, ColorType, CandlestickSeries } from 'lightweight-charts';

interface PriceChartProps {
    data: {
        date: string;
        open: number;
        high: number;
        low: number;
        close: number;
    }[];
    height?: number;
}

export function PriceChart({ data, height = 300 }: PriceChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current || data.length === 0) return;

        // Clear existing chart
        if (chartRef.current) {
            chartRef.current.remove();
        }

        // Create new chart
        const chart = createChart(chartContainerRef.current, {
            height,
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#9CA3AF',
            },
            grid: {
                vertLines: { color: 'rgba(42, 46, 57, 0.3)' },
                horzLines: { color: 'rgba(42, 46, 57, 0.3)' },
            },
            crosshair: {
                mode: 1,
            },
            rightPriceScale: {
                borderColor: 'rgba(42, 46, 57, 0.5)',
            },
            timeScale: {
                borderColor: 'rgba(42, 46, 57, 0.5)',
                timeVisible: true,
            },
        });

        chartRef.current = chart;

        // Add candlestick series using v5 API
        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#10B981',
            downColor: '#EF4444',
            borderUpColor: '#10B981',
            borderDownColor: '#EF4444',
            wickUpColor: '#10B981',
            wickDownColor: '#EF4444',
        });

        // Format data for the chart
        const chartData: CandlestickData<Time>[] = data.map(d => ({
            time: d.date as Time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
        }));

        candleSeries.setData(chartData);

        // Fit content
        chart.timeScale().fitContent();

        // Cleanup on unmount
        return () => {
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, [data, height]);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[300px] bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <p className="text-slate-500 dark:text-slate-400">No historical data available</p>
            </div>
        );
    }

    return (
        <div
            ref={chartContainerRef}
            className="w-full rounded-xl overflow-hidden"
        />
    );
}
