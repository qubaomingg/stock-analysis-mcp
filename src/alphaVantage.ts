import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

if (!API_KEY) {
    console.error('Alpha Vantage API key not found. Please set ALPHA_VANTAGE_API_KEY in your .env file.');
    process.exit(1);
}

/**
 * Fetches stock data from Alpha Vantage API
 * @param symbol Stock symbol (e.g., IBM, AAPL)
 * @param interval Time interval between data points or 'daily' for daily data
 * @param outputsize Amount of data to return (compact or full)
 * @returns Formatted stock data as a string
 */
export async function getStockData(symbol: string | string[], interval: string | string[] | 'daily', outputsize: string = 'compact'): Promise<string> {
    try {
        // Ensure parameters are strings, not arrays
        const symbolStr = Array.isArray(symbol) ? symbol[0] : symbol;
        const intervalStr = Array.isArray(interval) ? interval[0] : interval;
        const outputsizeStr = Array.isArray(outputsize) ? outputsize[0] : outputsize;

        let url: string;
        let timeSeriesKey: string;

        if (intervalStr === 'daily') {
            // Use TIME_SERIES_DAILY endpoint
            url = `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbolStr}&outputsize=${outputsizeStr}&apikey=${API_KEY}`;
            timeSeriesKey = 'Time Series (Daily)';
        } else {
            // Use TIME_SERIES_INTRADAY endpoint
            url = `${BASE_URL}?function=TIME_SERIES_INTRADAY&symbol=${symbolStr}&interval=${intervalStr}&outputsize=${outputsizeStr}&apikey=${API_KEY}`;
            timeSeriesKey = `Time Series (${intervalStr})`;
        }

        const response = await axios.get(url);

        // Check for error messages from Alpha Vantage
        if (response.data['Error Message']) {
            throw new Error(response.data['Error Message']);
        }

        if (response.data['Note']) {
            console.warn('API Usage Note:', response.data['Note']);
        }

        // Extract the time series data
        const timeSeries = response.data[timeSeriesKey];

        if (!timeSeries) {
            throw new Error('No time series data found in the response');
        }

        // Format the data
        const formattedData = formatTimeSeriesData(timeSeries, symbolStr, intervalStr);
        return formattedData;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(`API request failed: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Formats time series data into a readable string
 */
function formatTimeSeriesData(timeSeries: any, symbol: string, interval: string | 'daily'): string {
    const dates = Object.keys(timeSeries).sort().reverse(); // Most recent first

    let result = `Stock data for ${symbol.toUpperCase()} (${interval === 'daily' ? 'Daily' : interval} intervals):\n\n`;

    // Limit to 10 data points to avoid overwhelming responses
    const limitedDates = dates.slice(0, 10);

    for (const date of limitedDates) {
        const data = timeSeries[date];
        result += `${date}:\n`;
        result += `  Open: ${data['1. open']}\n`;
        result += `  High: ${data['2. high']}\n`;
        result += `  Low: ${data['3. low']}\n`;
        result += `  Close: ${data['4. close']}\n`;
        result += `  Volume: ${data['5. volume']}\n\n`;
    }

    if (dates.length > 10) {
        result += `... and ${dates.length - 10} more data points available.\n`;
    }

    return result;
}

/**
 * Analyzes stock data to generate alerts based on price movements
 * @param symbol Stock symbol (e.g., IBM, AAPL)
 * @param threshold Percentage threshold for price movement alerts
 * @returns Formatted alerts as a string
 */
export async function getStockAlerts(symbol: string | string[], threshold: number = 5): Promise<string> {
    try {
        // Ensure symbol is a string, not an array
        const symbolStr = Array.isArray(symbol) ? symbol[0] : symbol;

        // Get daily stock data for analysis
        const url = `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbolStr}&outputsize=compact&apikey=${API_KEY}`;
        const response = await axios.get(url);

        if (response.data['Error Message']) {
            throw new Error(response.data['Error Message']);
        }

        const timeSeries = response.data['Time Series (Daily)'];

        if (!timeSeries) {
            throw new Error('No time series data found in the response');
        }

        // Get dates sorted from newest to oldest
        const dates = Object.keys(timeSeries).sort().reverse();

        if (dates.length < 2) {
            return `Not enough historical data available for ${symbolStr} to generate alerts.`;
        }

        let alerts = `Stock Alerts for ${symbolStr.toUpperCase()} (${threshold}% threshold):\n\n`;
        let alertCount = 0;

        // Analyze the last 10 days (or less if not available)
        const daysToAnalyze = Math.min(10, dates.length - 1);

        for (let i = 0; i < daysToAnalyze; i++) {
            const currentDate = dates[i];
            const previousDate = dates[i + 1];

            const currentClose = parseFloat(timeSeries[currentDate]['4. close']);
            const previousClose = parseFloat(timeSeries[previousDate]['4. close']);

            // Calculate percentage change
            const percentChange = ((currentClose - previousClose) / previousClose) * 100;
            const absPercentChange = Math.abs(percentChange);

            // Check if change exceeds threshold
            if (absPercentChange >= threshold) {
                const direction = percentChange >= 0 ? 'increased' : 'decreased';
                alerts += `${currentDate}: Price ${direction} by ${absPercentChange.toFixed(2)}% from ${previousClose} to ${currentClose}\n`;
                alertCount++;
            }
        }

        if (alertCount === 0) {
            alerts += `No significant price movements (>=${threshold}%) detected in the last ${daysToAnalyze} trading days.\n`;
        }

        return alerts;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(`API request failed: ${error.message}`);
        }
        throw error;
    }
} 