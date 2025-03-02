# Alpha Vantage Stock MCP Server

This is a Model Context Protocol (MCP) server that provides stock market data from Alpha Vantage API. It allows Claude and other MCP clients to access real-time and historical stock data.

## Features

- Get intraday stock data with customizable intervals
- Get daily stock data
- Generate stock alerts based on price movements
- Access stock data as resources

## Prerequisites

- Node.js 16 or higher
- An Alpha Vantage API key (get one for free at [Alpha Vantage](https://www.alphavantage.co/support/#api-key))

## Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory and add your Alpha Vantage API key:
   ```
   ALPHA_VANTAGE_API_KEY=your_api_key_here
   ```

## Building and Running

Build the TypeScript code:
```
npm run build
```

Run the server:
```
npm start
```

For development with auto-reloading:
```
npm run dev
```

Test the API client:
```
npm test
```

## Using with Claude for Desktop

To use this MCP server with Claude for Desktop:

1. Open Claude for Desktop
2. Go to Settings > Developer > Edit Config
3. Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "alpha-vantage": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
      "env": {
        "ALPHA_VANTAGE_API_KEY": "YOUR_API_KEY"
      } 
    }
  }
}
```

Replace `/absolute/path/to/dist/index.js` with the absolute path to the built index.js file.

4. Restart Claude for Desktop

## Available Tools

### get-stock-data

Gets intraday stock data for a specific symbol.

Parameters:
- `symbol` (required): Stock symbol (e.g., IBM, AAPL)
- `interval` (optional): Time interval between data points (1min, 5min, 15min, 30min, 60min). Default: 5min
- `outputsize` (optional): Amount of data to return (compact: latest 100 data points, full: up to 20 years of data). Default: compact

### get-daily-stock-data

Gets daily stock data for a specific symbol.

Parameters:
- `symbol` (required): Stock symbol (e.g., IBM, AAPL)
- `outputsize` (optional): Amount of data to return (compact: latest 100 data points, full: up to 20 years of data). Default: compact

### get-stock-alerts

Analyzes stock data to generate alerts based on price movements.

Parameters:
- `symbol` (required): Stock symbol (e.g., IBM, AAPL)
- `threshold` (optional): Percentage threshold for price movement alerts. Default: 5

## Available Resources

### stock-data

Access stock data directly as a resource.

URI Template: `stock://{symbol}/{interval}`

Parameters:
- `symbol`: Stock symbol (e.g., IBM, AAPL)
- `interval`: Time interval (daily, 1min, 5min, 15min, 30min, 60min). Default: daily

Example usage in Claude:
- "Can you analyze this stock data: stock://AAPL/daily"
- "What do you think about this data: stock://MSFT/5min"

## License

ISC 