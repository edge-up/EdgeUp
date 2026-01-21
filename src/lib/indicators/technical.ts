// Technical Indicators Utility Functions

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): number[] {
    const sma: number[] = [];

    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            sma.push(NaN);
            continue;
        }

        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        sma.push(sum / period);
    }

    return sma;
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);

    // First EMA is SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
        sum += data[i];
        ema.push(NaN);
    }
    ema[period - 1] = sum / period;

    // Calculate EMA for remaining values
    for (let i = period; i < data.length; i++) {
        ema.push((data[i] - ema[i - 1]) * multiplier + ema[i - 1]);
    }

    return ema;
}

/**
 * Calculate Relative Strength Index (RSI)
 */
export function calculateRSI(prices: number[], period = 14): number[] {
    const rsi: number[] = [];

    if (prices.length < period + 1) {
        return prices.map(() => NaN);
    }

    let gains = 0;
    let losses = 0;

    // Initial average gain/loss
    for (let i = 1; i <= period; i++) {
        const change = prices[i] - prices[i - 1];
        if (change > 0) {
            gains += change;
        } else {
            losses += Math.abs(change);
        }
        rsi.push(NaN);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    const rs = avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));

    // Subsequent RSI values
    for (let i = period + 1; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1];
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? Math.abs(change) : 0;

        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;

        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
    }

    return rsi;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(prices: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const emaFast = calculateEMA(prices, fastPeriod);
    const emaSlow = calculateEMA(prices, slowPeriod);

    const macdLine = emaFast.map((val, i) => val - emaSlow[i]);
    const signalLine = calculateEMA(macdLine.filter(v => !isNaN(v)), signalPeriod);

    // Pad signal line with NaN to match length
    const paddedSignal = [...Array(macdLine.length - signalLine.length).fill(NaN), ...signalLine];

    const histogram = macdLine.map((val, i) => val - paddedSignal[i]);

    return {
        macdLine,
        signalLine: paddedSignal,
        histogram,
    };
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(prices: number[], period = 20, stdDev = 2) {
    const sma = calculateSMA(prices, period);
    const upperBand: number[] = [];
    const lowerBand: number[] = [];

    for (let i = 0; i < prices.length; i++) {
        if (i < period - 1) {
            upperBand.push(NaN);
            lowerBand.push(NaN);
            continue;
        }

        const slice = prices.slice(i - period + 1, i + 1);
        const mean = sma[i];
        const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
        const std = Math.sqrt(variance);

        upperBand.push(mean + stdDev * std);
        lowerBand.push(mean - stdDev * std);
    }

    return {
        middle: sma,
        upper: upperBand,
        lower: lowerBand,
    };
}

/**
 * Calculate Volume Weighted Average Price (VWAP)
 */
export function calculateVWAP(prices: number[], volumes: number[]): number[] {
    const vwap: number[] = [];
    let cumulativeTPV = 0; // Typical Price * Volume
    let cumulativeVolume = 0;

    for (let i = 0; i < prices.length; i++) {
        const typicalPrice = prices[i];
        cumulativeTPV += typicalPrice * volumes[i];
        cumulativeVolume += volumes[i];

        vwap.push(cumulativeTPV / cumulativeVolume);
    }

    return vwap;
}

/**
 * Identify support and resistance levels
 */
export function findSupportResistance(highs: number[], lows: number[], lookback = 20) {
    const levels: { price: number; type: 'support' | 'resistance'; strength: number }[] = [];

    // Find local maxima (resistance)
    for (let i = lookback; i < highs.length - lookback; i++) {
        const slice = highs.slice(i - lookback, i + lookback + 1);
        const max = Math.max(...slice);

        if (highs[i] === max) {
            levels.push({
                price: highs[i],
                type: 'resistance',
                strength: 1,
            });
        }
    }

    // Find local minima (support)
    for (let i = lookback; i < lows.length - lookback; i++) {
        const slice = lows.slice(i - lookback, i + lookback + 1);
        const min = Math.min(...slice);

        if (lows[i] === min) {
            levels.push({
                price: lows[i],
                type: 'support',
                strength: 1,
            });
        }
    }

    return levels;
}
