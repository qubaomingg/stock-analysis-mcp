import { getStockData, getStockAlerts } from './alphaVantage.js';

async function testAlphaVantage() {
    try {
        console.log('Testing Alpha Vantage API client...');

        // Test getting intraday stock data
        console.log('\nTesting getStockData (intraday)...');
        const intradayData = await getStockData('IBM', '5min', 'compact');
        console.log(intradayData);

        // Test getting daily stock data
        console.log('\nTesting getStockData (daily)...');
        const dailyData = await getStockData('IBM', 'daily', 'compact');
        console.log(dailyData);

        // Test getting stock alerts
        console.log('\nTesting getStockAlerts...');
        const alerts = await getStockAlerts('IBM', 3);
        console.log(alerts);

        console.log('\nAll tests completed successfully!');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testAlphaVantage(); 