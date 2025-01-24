import ccxt from "ccxt";
import fs from "fs";
import { calculate30mIndicators } from "../indicators/calculateIndicators30m.js";
import { isTrading } from "../strategyTrading/tradingState.js";
import { saveOHLCVToCSV } from "./saveOHLCVToCSV.js";
import { loadHistoricalData } from "./loadHistoricalData.js";
import { orderBookAveragePrice } from "../indicators/orderBookAveragePrice.js";
import { calculate4hIndicators } from "../indicators/calculateIndicators4h.js";
import { calculateIndicators5m } from "../indicators/calculateIndicators5m.js";
import { evaluation5mIndicators } from "../strategyTrading/evaluation5mIndicators.js";
import { evaluation4hIndicators } from "../strategyTrading/evaluation4hIndicators.js";
import { evaluation30mIndicators } from "../strategyTrading/evaluation30mIndicators.js";
const exchange = new ccxt.bingx({
  // apiKey: process.env.TEST_API_KEY,
  // secret: process.env.SECRET_TEST_API_KEY,
  //timeout: 20000,
});

const symbol = "BTC-USDT";
const timeframe4h = "4h";
const timeframe30m = "30m";
const timeframe5m = "5m";
const limit = 1000;
const now = new Date();
const monthsAgo = new Date(now.setMonth(now.getMonth() - 4));
const since = exchange.parse8601(monthsAgo.toISOString());
const filePath4h = `ohlcv_${symbol}_${timeframe4h}.csv`;
const filePath30m = `ohlcv_${symbol}_${timeframe30m}.csv`;
const filePath5m = `ohlcv_${symbol}_${timeframe5m}.csv`;
const sixHoursInDay = 24 / 4;
const currentDate = new Date();
const currentDay = currentDate.getDay();
const daysToSubtract = (currentDay + 6) % 7;
const partialWeekCandles = daysToSubtract * sixHoursInDay;
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

    let fiveMinuteOhlcv = await exchange.fetchOHLCV(
      symbol,
      timeframe5m,
      undefined,
      totalCandlesToFetch
    );

    if (
      !ohlcv ||
      ohlcv.length === 0 ||
      !fourHoursOhlcv ||
      fourHoursOhlcv.length === 0 ||
      !fiveMinuteOhlcv ||
      fiveMinuteOhlcv.length === 0
    ) {
      console.log("No new data available from the exchange.");
      return null;
    }
    // Save fetched data to CSV
    saveOHLCVToCSV(ohlcv, filePath30m, true);
    saveOHLCVToCSV(fourHoursOhlcv, filePath4h, true);
    saveOHLCVToCSV(fiveMinuteOhlcv, filePath5m, true);

    console.log("Market data fetched and saved to CSV.");

    return { ohlcv, fourHoursOhlcv, fiveMinuteOhlcv };
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

let cachedData = {
  processedData: null,
  processedData4h: null,
  processedData5m: null,
  lastLoaded: null, 
};

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
      !fs.existsSync(filePath5m)
    ) {
      console.warn("One or more CSV files not found.");
      return { processedData: [], processedData4h: [], processedData5m: [] };
    }

    const historicalData = await loadHistoricalData(
      filePath30m,
      filePath4h,
      filePath5m
    );

    const { data, data4h, data5m } = historicalData;

    const processedData = convertToArrayOfArrays(data, "30m");
    const processedData4h = convertToArrayOfArrays(data4h, "4h");
    const processedData5m = convertToArrayOfArrays(data5m, "5m");

    // Cache the processed data
    cachedData = {
      processedData,
      processedData4h,
      processedData5m,
      lastLoaded: Date.now(),
    };

    return cachedData;
  } catch (error) {
    console.error("Error loading historical data:", error);
    return { processedData: [], processedData4h: [], processedData5m: [] };
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
    indicators = calculate30mIndicators(reversedArray);
  } else if (type === "4h") {
    indicators = calculate4hIndicators(reversedArray);
  } else {
    indicators = calculateIndicators5m(reversedArray);
  }

  return { ...indicators };
}

// Main strategy execution function
export async function fetchDataForStrategy() {
  const fetchInterval4h = 3600000;
  const fetchInterval30m = 900000;
  const fetchInterval5m = 300000;
  const strategyInterval4h = 3600000;
  const strategyInterval30m = 900000;
  const strategyInterval5m = 300000;

  // Function to handle strategy execution for different intervals
  async function runStrategy(interval) {
    if (!isTrading()) {
      console.log(
        `Trading is currently stopped. Skipping strategy execution for ${interval}`
      );
      return;
    }

    try {
      console.log(`Fetching cached data for ${interval} strategy...`);

      const { processedData, processedData4h, processedData5m } =
        await loadHistoricalDataForStrategy();

      let dataToReturn4h;
      let dataToReturn30m;
      let dataToReturn5m;

      // Execute the appropriate indicator evaluation based on the interval
      if (interval === "4h") {
        console.log("Running 4h strategy evaluation...");
        dataToReturn4h = evaluation4hIndicators(processedData4h);
      } else if (interval === "30m") {
        console.log("Running 30m strategy evaluation...");
        dataToReturn30m = evaluation30mIndicators(processedData);
      } else if (interval === "5m") {
        console.log("Running 5m strategy evaluation...");
        dataToReturn5m = evaluation5mIndicators(processedData5m);
      }

      return { dataToReturn4h, dataToReturn30m, dataToReturn5m };
    } catch (error) {
      console.error(`Error in ${interval} strategy:`, error);
    } finally {
      // Dynamically set the strategy interval for the next execution
      let strategyInterval;
      if (interval === "4h") {
        strategyInterval = strategyInterval4h;
      } else if (interval === "30m") {
        strategyInterval = strategyInterval30m;
      } else if (interval === "5m") {
        strategyInterval = strategyInterval5m;
      }

      // Schedule the next execution
      setTimeout(() => runStrategy(interval), strategyInterval);
    }
  }

  async function runMarketUpdate(interval) {
    try {
      console.log("Updating market data...");
      const { ohlcv, fourHoursOhlcv, fiveMinuteOhlcv } =
        await fetchMarketData();

      // Handle the fetched data based on the interval
      let dataToReturn;
      if (interval === "4h") {
        console.log("Running 4h market update...");
        dataToReturn = fourHoursOhlcv;
      } else if (interval === "30m") {
        console.log("Running 30m market update...");
        dataToReturn = ohlcv;
      } else if (interval === "5m") {
        console.log("Running 5m market update...");
        dataToReturn = fiveMinuteOhlcv;
      }

      // Return the data for the selected interval
      return dataToReturn;
    } catch (error) {
      console.error("Error updating market data:", error);
    } finally {
      // Reschedule the update based on the fetch interval
      let fetchInterval;
      if (interval === "4h") {
        fetchInterval = fetchInterval4h;
      } else if (interval === "30m") {
        fetchInterval = fetchInterval30m;
      } else if (interval === "5m") {
        fetchInterval = fetchInterval5m;
      }

      // Schedule the next execution of data update
      setTimeout(() => runMarketUpdate(interval), fetchInterval);
    }
  }

  // Start fetching data and running strategies for all intervals
  runStrategy("4h");
  runStrategy("30m");
  runStrategy("5m");
  runMarketUpdate("4h");
  runMarketUpdate("30m");
  runMarketUpdate("5m");
}
