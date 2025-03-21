import ccxt from "ccxt";
import fs from "fs";
import "dotenv/config";
import { isTrading } from "../strategy_evaluation_trading/tradingState.js";
import { saveOHLCVToCSV } from "./saveOHLCVToCSV.js";
import { loadHistoricalData } from "./loadHistoricalData.js";
import { orderBookAveragePrice } from "../indicators/orderBookAveragePrice.js";
import { calculateIndicators } from "../calculations_different_timeframes/calculateIndicators.js";
import { evaluationIndicators } from "../strategy_evaluation_trading/evaluationIndicators.js";

const exchange = new ccxt.bingx({
  timeout: 50000,
  enableRateLimit: true,
});

const symbol = "BTC-USDT";
const timeframe4h = "4h";
const timeframe30m = "30m";
const timeframe15m = "15m";
const limit = 1000;
const now = new Date();
const monthsAgo = new Date(now.getTime());
monthsAgo.setMonth(now.getMonth() - 4);
const daysAgo = new Date(now.getTime());
daysAgo.setDate(now.getDate() - 15);
const since = exchange.parse8601(monthsAgo.toISOString());
const since15m = exchange.parse8601(daysAgo.toISOString());

const filePath4h = `ohlcv_${symbol}_${timeframe4h}.csv`;
const filePath30m = `ohlcv_${symbol}_${timeframe30m}.csv`;
const filePath15m = `ohlcv_${symbol}_${timeframe15m}.csv`;

let cachedData = {
  processedData: null,
  processedData4h: null,
  processedData5m: null,
  lastLoaded: null,
};

// Helper for WebSocket fetching data
export async function webSocketOrderBookFetch() {
  const orderbook = await exchange.fetchOrderBook(symbol);
  const bidAskSpread = orderBookAveragePrice(orderbook);
  const realTimePrice = await exchange.fetchTicker(symbol);

  return { orderbook, bidAskSpread, realTimePrice };
}

// Main function to fetch API from BingX
export async function fetchMarketData() {
  try {
    console.log("Fetching market data...");

    // Fetch all OHLCV data in parallel
    const [ohlcv, fourHoursOhlcv, fifteenMinuteOhlcv] = await Promise.all([
      handleCcxtErrors(() =>
        fetchFullOHLCV(exchange, symbol, timeframe30m, since, limit)
      ),
      handleCcxtErrors(() =>
        fetchFullOHLCV(exchange, symbol, timeframe4h, since, limit)
      ),
      handleCcxtErrors(() =>
        fetchFullOHLCV(exchange, symbol, timeframe15m, since15m, limit)
      ),
    ]);

    // Check if any data is missing
    if (!ohlcv || !fourHoursOhlcv || !fifteenMinuteOhlcv) {
      console.log("No new data available from the exchange.");
      return null;
    }

    console.log("All OHLCV data fetched. Now saving...");

    // Save all fetched data to CSV
    [
      { data: ohlcv, path: filePath30m },
      { data: fourHoursOhlcv, path: filePath4h },
      { data: fifteenMinuteOhlcv, path: filePath15m },
    ].forEach(({ data, path }) => saveOHLCVToCSV(data, path, true));

    console.log("Market data fetched and saved to CSV.");
    return { ohlcv, fourHoursOhlcv, fifteenMinuteOhlcv };
  } catch (error) {
    console.error("Error fetching market data:", error);
  }
}

// Helper to fetch 4month data
export async function fetchFullOHLCV(
  exchange,
  symbol,
  timeframe,
  since,
  limit
) {
  let allOHLCV = [];
  let fetchSince = since;

  while (true) {
    // Wait before sending the request to prevent getting banned
    await exchange.sleep(exchange.rateLimit);

    try {
      const ohlcv = await exchange.fetchOHLCV(
        symbol,
        timeframe,
        fetchSince,
        limit
      );

      if (ohlcv.length === 0) {
        break; // No more data available
      }

      allOHLCV = allOHLCV.concat(ohlcv);

      // Update 'since' to the last timestamp + 1ms
      fetchSince = ohlcv[ohlcv.length - 1][0] + 1;

      // Stop if we got fewer candles than requested (end of historical data)
      if (ohlcv.length < limit) {
        break;
      }
    } catch (error) {
      console.error(`Error fetching ${timeframe} data:`, error);
      await exchange.sleep(5000); // Wait 5 seconds before retrying in case of an error
    }
  }

  return allOHLCV;
}

// Helper to retrieve historicaldata from CSV files
export async function loadHistoricalDataForStrategy() {
  try {
    // Avoid loading data if it's already cached and recent
    if (
      cachedData.processedData &&
      cachedData.processedData4h &&
      cachedData.processedData5m &&
      Date.now() - cachedData.lastLoaded < 5 * 60 * 1000
    ) {
      console.log("Using cached historical data...");
      return cachedData;
    }

    console.log("Loading historical data for strategy...");
    if (
      !fs.existsSync(filePath30m) ||
      !fs.existsSync(filePath4h) ||
      !fs.existsSync(filePath15m)
    ) {
      console.warn("One or more CSV files not found.");
      return { processedData: [], processedData4h: [], processedData15m: [] };
    }

    // Destructure directly from function call
    const { data, data4h, data15m } = await loadHistoricalData(
      filePath30m,
      filePath4h,
      filePath15m
    );

    // Process all data with a single function call
    const processedData = processMultipleTimeframes([
      { data: data, type: "30m" },
      { data: data4h, type: "4h" },
      { data: data15m, type: "15m" },
    ]);

    // Cache the processed data
    cachedData = {
      processedData: processedData["30m"],
      processedData4h: processedData["4h"],
      processedData15m: processedData["15m"],
      lastLoaded: Date.now(),
    };

    return cachedData;
  } catch (error) {
    console.error("Error loading historical data:", error);
    return { processedData: [], processedData4h: [], processedData15m: [] };
  }
}

// Helper function to process data for multiple timeframes
function processMultipleTimeframes(timeframes) {
  const processedData = {};

  timeframes.forEach(({ data, type }) => {
    processedData[type] = convertToArrayOfArrays(data, type);
  });

  return processedData;
}

// Helper to convert object data into array
export function convertToArrayOfArrays(ohlcv, type) {
  const arrayOfArrays = ohlcv.map((candle) => [
    candle.timestamp,
    candle.open,
    candle.high,
    candle.low,
    candle.close,
    candle.volume,
  ]);

  const indicators = calculateIndicators(arrayOfArrays, type);
  return { ...indicators };
}
// Main strategy evaluation and update market functions
export async function fetchDataForStrategy() {
  const fetchIntervals = {
    "4h": 7200000,
    "30m": 900000,
    "15m": 150000,
  };

  async function evaluateStrategy(interval) {
    if (!isTrading()) {
      console.log(
        `Trading is currently stopped. Skipping strategy evaluation for ${interval}`
      );
      return;
    }

    try {
      console.log(`Fetching cached data for ${interval} strategy...`);
      const { processedData, processedData4h, processedData15m } =
        await loadHistoricalDataForStrategy();

      // Map timeframes to the corresponding processed data
      const dataMap = {
        "4h": processedData4h,
        "30m": processedData,
        "15m": processedData15m,
      };

      console.log(`Running ${interval} strategy evaluation...`);
      return evaluationIndicators(dataMap[interval], interval);
    } catch (error) {
      console.error(`Error in ${interval} strategy:`, error);
    } finally {
      setTimeout(() => evaluateStrategy(interval), fetchIntervals[interval]);
    }
  }

  async function runMarketUpdate(interval) {
    try {
      console.log("Updating market data...");
      const { ohlcv, fourHoursOhlcv, fifteenMinuteOhlcv } =
        await fetchMarketData();

      const dataMap = {
        "4h": fourHoursOhlcv,
        "30m": ohlcv,
        "15m": fifteenMinuteOhlcv,
      };

      console.log(`Running ${interval} market update...`);
      return dataMap[interval];
    } catch (error) {
      console.error("Error updating market data:", error);
    } finally {
      setTimeout(() => runMarketUpdate(interval), fetchIntervals[interval]);
    }
  }

  // Execute both functions for all timeframes
  ["4h", "30m", "15m"].forEach((interval) => {
    evaluateStrategy(interval);
    runMarketUpdate(interval);
  });
}

async function handleCcxtErrors(fn, retryCount = 3, delay = 1000) {
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof ccxt.RequestTimeout) {
        console.error(
          `Request Timeout on attempt ${attempt}: ${error.message}`
        );
      } else if (error instanceof ccxt.NetworkError) {
        console.error(`Network Error on attempt ${attempt}: ${error.message}`);
      } else if (error instanceof ccxt.FetchError) {
        console.error(`Fetching Error on attempt ${attempt}: ${error.message}`);
      } else if (error instanceof ccxt.ExchangeError) {
        console.error(`Exchange Error: ${error.message}`);
        if (error.message.includes("429")) {
          console.error("Rate limit exceeded. Retrying after a delay...");
          delay *= 2; // Increase delay if rate-limited
        } else if (error.message.includes("403")) {
          console.error("Access forbidden. Check API keys or permissions.");
          return null;
        }
      } else if (error instanceof ccxt.BaseError) {
        console.error(`Base Error: ${error.message}`);
      } else {
        console.error(`Unexpected Error: ${error.message}`);
      }

      if (attempt < retryCount) {
        console.log(
          `Retrying in ${delay / 1000} seconds... (${
            retryCount - attempt
          } attempts left)`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error("Max retries reached. Could not connect.");
        return null;
      }
    }
  }
}
