'use client';

import { useEffect, useRef } from 'react';
import { createChart, IChartApi, LineData, Time, ColorType, AreaSeries } from 'lightweight-charts';

interface OIChartProps {
    data: {
        date: string;
        oi: number | null;
        oiChange: number | null;
    }[];
    height?: number;
}

export function OIChart({ data, height = 200 }: OIChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const validData = data.filter(d => d.oi !== null);
        if (validData.length === 0) return;

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
            rightPriceScale: {
                borderColor: 'rgba(42, 46, 57, 0.5)',
            },
            timeScale: {
                borderColor: 'rgba(42, 46, 57, 0.5)',
            },
        });

        chartRef.current = chart;

        // Add area series using v5 API
        const areaSeries = chart.addSeries(AreaSeries, {
            lineColor: '#6366F1',
            topColor: 'rgba(99, 102, 241, 0.4)',
            bottomColor: 'rgba(99, 102, 241, 0.0)',
            lineWidth: 2,
        });

        // Format data
        const chartData: LineData<Time>[] = validData.map(d => ({
            time: d.date as Time,
            value: d.oi!,
        }));

        areaSeries.setData(chartData);
        chart.timeScale().fitContent();

        return () => {
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, [data, height]);

    const validData = data.filter(d => d.oi !== null);

    if (validData.length === 0) {
        return (
            <div className="flex items-center justify-center h-[200px] bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <p className="text-slate-500 dark:text-slate-400">No OI history available</p>
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
