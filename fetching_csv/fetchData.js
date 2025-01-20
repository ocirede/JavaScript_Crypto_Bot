import ccxt from "ccxt";
import fs from "fs";
import { calculate30mIndicators } from "../indicators/calculateIndicators30m.js";
import { isTrading } from "../strategyTrading/tradingState.js";
import { tradingStrategy } from "../strategyTrading/strategy.js";
import { saveOHLCVToCSV } from "./saveOHLCVToCSV.js";
import { loadHistoricalData } from "./loadHistoricalData.js";
import { orderBookAveragePrice } from "../indicators/orderBookAveragePrice.js";
import { calculate4hIndicators } from "../indicators/calculateIndicators4h.js";

const exchange = new ccxt.bingx({
  // apiKey: process.env.TEST_API_KEY,
  // secret: process.env.SECRET_TEST_API_KEY,
  //timeout: 20000,
});

const symbol = "BTC-USDT";
const timeframe30m = "30m";
const timeframe4h = "4h";
const limit = 1000;
const now = new Date();
const monthsAgo = new Date(now.setMonth(now.getMonth() - 4));
const since = exchange.parse8601(monthsAgo.toISOString());
const filePath = `ohlcv_${symbol}_${timeframe30m}.csv`;
const filePath4h = `ohlcv_${symbol}_${timeframe4h}.csv`;
const fourHoursInDay = 24 / 4;
const currentDate = new Date();
const currentDay = currentDate.getDay();
const daysToSubtract = (currentDay + 6) % 7;
const partialWeekCandles = daysToSubtract * fourHoursInDay;
const twoWeeksCandles = 84;
const totalCandlesToFetch = twoWeeksCandles + partialWeekCandles;

export async function webSocketOrderBookFetch() {
  const orderbook = await exchange.fetchOrderBook(symbol);
  const bidAskSpread = orderBookAveragePrice(orderbook);
  const realTimePrice = await exchange.fetchTicker(symbol);
  return { orderbook, bidAskSpread };
}

export async function fetchMarketData() {
  try {
    console.log("Fetching market data...");

    let ohlcv = await fetchFullOHLCV(
      exchange,
      symbol,
      timeframe30m,
      since,
      limit
    );

    let fourHoursOhlcv = await exchange.fetchOHLCV(
      symbol,
      timeframe4h,
      undefined,
      totalCandlesToFetch
    );

    if (!ohlcv || ohlcv.length === 0) {
      console.log("No new data available from the exchange.");
      return null;
    }

    if (!fourHoursOhlcv || fourHoursOhlcv.length === 0) {
      console.log("No new data available from the exchange.");
      return null;
    }
    // Save fetched data to CSV
    saveOHLCVToCSV(ohlcv, filePath, true);
    saveOHLCVToCSV(fourHoursOhlcv, filePath4h, true);
    console.log("Market data fetched and saved to CSV.");

    return { ohlcv, fourHoursOhlcv };
  } catch (error) {
    console.error("Error fetching market data:", error);

    if (error instanceof ccxt.NetworkError) {
      console.error("Network Error:", error.message);
    } else if (error instanceof ccxt.ExchangeError) {
      console.error("Exchange Error:", error.message);
      if (error.message.includes("429")) {
        console.error("Rate limit exceeded. You might be temporarily banned.");
      } else if (error.message.includes("403")) {
        console.error(
          "Access forbidden. You might be banned or using an invalid API key."
        );
      }
    } else if (error instanceof ccxt.BaseError) {
      console.error("Base Error:", error.message);
    } else {
      console.error("Unexpected Error:", error);
    }

    return null;
  }
}

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
    const ohlcv = await exchange.fetchOHLCV(
      symbol,
      timeframe,
      fetchSince,
      limit
    );

    if (ohlcv.length === 0) {
      break;
    }

    allOHLCV = allOHLCV.concat(ohlcv);

    // Update 'since' to the last timestamp + 1ms to avoid overlap
    const lastTimestamp = ohlcv[ohlcv.length - 1][0];
    fetchSince = lastTimestamp + 1;

    // Break if fewer candles than the limit were fetched (indicating the end of data)
    if (ohlcv.length < limit) {
      break;
    }

    // Rate limiting to avoid hitting exchange limits
    await exchange.sleep(exchange.rateLimit);
  }

  return allOHLCV;
}

export async function loadHistoricalDataForStrategy() {
  try {
    console.log("Loading historical data for strategy...");
    if (!fs.existsSync(filePath)) {
      console.warn("CSV file not found.");
      return { processedData: [], processedData4h: [] };
    }

    const historicalData = await loadHistoricalData(filePath, filePath4h);
    const { data, data4h } = historicalData;
    const processedData = convertToArrayOfArrays(data, "30m");
    const processedData4h = convertToArrayOfArrays(data4h, "4h");

    return { processedData, processedData4h };
  } catch (error) {
    console.error("Error loading historical data:", error);
    return { processedData: [], processedData4h: [] };
  }
}

export function convertToArrayOfArrays(ohlcv, type) {
  const arrayOfArrays = ohlcv.map((candle) => [
    candle.timestamp,
    candle.open,
    candle.high,
    candle.low,
    candle.close,
    candle.volume,
  ]);


  const reversedArray = arrayOfArrays.slice().reverse();
  let indicators;

  if (type === "30m") {
    indicators = calculate30mIndicators(
     reversedArray, 
    );
  } else if (type === "4h") {
    indicators = calculate4hIndicators(
     reversedArray,
    );
  }

  return { ...indicators };
}


export async function fetchDataForStrategy() {
  const fetchInterval = 900000;
  const strategyInterval = 450000;

  async function runStrategy() {
    if (!isTrading()) {
      console.log("Trading is currently stopped. Skipping strategy execution");
      return;
    }

    try {
      console.log("Fetching market data...");
      const { processedData, processedData4h } =
        await loadHistoricalDataForStrategy();

      if (!processedData || processedData.length === 0) {
        console.log("No historical data available for strategy.");
        return;
      }

      if (!processedData4h || processedData4h.length === 0) {
        console.log("No historical data available for strategy.");
        return;
      }

      tradingStrategy(processedData, processedData4h);
    } catch (error) {
      console.error("Error in strategy runner:", error);
    } finally {
      // Schedule the next fetch
      setTimeout(runStrategy, strategyInterval);
    }
  }

  async function runMarketUpdate() {
    try {
      await fetchMarketData();
    } catch (error) {
      console.error("Error updating market data:", error);
    } finally {
      setTimeout(runMarketUpdate, fetchInterval);
    }
  }

  // Start fetching data for the strategy
  runStrategy();
  runMarketUpdate();
}
