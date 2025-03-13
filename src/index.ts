import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";
import { getStockData, getStockAlerts } from './alphaVantage.js'; // 修改扩展名为 .js

// Load environment variables
dotenv.config();

// Create an MCP server
const server = new McpServer({
  name: 'alpha-vantage-stock-data',
  version: '1.0.0',
});

// Add a resource for stock data
server.resource(
  'stock-data',
  new ResourceTemplate('stock://{symbol}/{interval}', { list: undefined }),
  async (uri, { symbol, interval = 'daily' }) => {
    try {
      // Ensure interval is a string, not an array
      const intervalStr = Array.isArray(interval) ? interval[0] : interval;
      const data = await getStockData(
        symbol,
        intervalStr === 'daily' ? 'daily' : intervalStr,
        'compact',
      );
      return {
        contents: [
          {
            uri: uri.href,
            text: data,
            mimeType: 'text/plain',
          },
        ],
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch stock data: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  },
);

// Add a tool to get stock data
server.tool(
  'get-stock-data',
  {
    symbol: z.string().describe('Stock symbol (e.g., IBM, AAPL)'),
    interval: z
      .enum(['1min', '5min', '15min', '30min', '60min'])
      .optional()
      .describe('Time interval between data points (default: 5min)'),
    outputsize: z
      .enum(['compact', 'full'])
      .optional()
      .describe(
        'Amount of data to return (compact: latest 100 data points, full: up to 20 years of data)',
      ),
  },
  async ({ symbol, interval = '5min', outputsize = 'compact' }) => {
    try {
      const data = await getStockData(symbol, interval, outputsize);
      return {
        content: [{ type: 'text', text: data }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching stock data: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Add a tool to get stock alerts based on price movements
server.tool(
  'get-stock-alerts',
  {
    symbol: z.string().describe('Stock symbol (e.g., IBM, AAPL)'),
    threshold: z
      .number()
      .optional()
      .describe('Percentage threshold for price movement alerts (default: 5)'),
  },
  async ({ symbol, threshold = 5 }) => {
    try {
      const alerts = await getStockAlerts(symbol, threshold);
      return {
        content: [{ type: 'text', text: alerts }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error generating stock alerts: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Add a tool to get daily stock data
server.tool(
  'get-daily-stock-data',
  {
    symbol: z.string().describe('Stock symbol (e.g., IBM, AAPL)'),
    outputsize: z
      .enum(['compact', 'full'])
      .optional()
      .describe(
        'Amount of data to return (compact: latest 100 data points, full: up to 20 years of data)',
      ),
  },
  async ({ symbol, outputsize = 'compact' }) => {
    try {
      const data = await getStockData(symbol, 'daily', outputsize);
      return {
        content: [{ type: 'text', text: data }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching daily stock data: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  },
);

async function main() {
  try {
    // Create a transport for stdio communication
    const transport = new StdioServerTransport();

    // Connect the server to the transport
    await server.connect(transport);

    console.error('Alpha Vantage Stock MCP Server running on stdio');
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

main();
