import {ATR, ADX, VWAP, WEMA } from "technicalindicators";
import { calculateEMA } from "./emaCalculation.js";
import { calculateVolumeProfile } from "./calculateVolumeProfile.js";
import { calculateMACD } from "./macdCalculation.js";
import { calculateBollingerBands } from "./bollingerBandsCalculation.js";
import { kalmanFilter } from "./kalmanFilter.js";
import { realTimePrice } from "../servers/webSocket.js";
import { saveIndicators30mToCsv } from "../fetching_csv/saveIndicators30mToCsv.js";
import { calculateVWAPBands } from "./calculateVMAPBands.js";
import { getTRSpikes } from "./trueRange.js";
import {linearRegressionSlope,checkTrendLine,fitTrendlinesHighLow,optimizeSlope,fitTrendlinesSingle} from "./linearRegression.js";

// Calculate technical indicators
export function calculate30mIndicators({ reversedArray }) {
  const sliceOHLCV = reversedArray.slice(0, 56);
  const candlesPerSession = 14;
  const symbol = "BTC-USDT";
  const timeframe30m = "30m";
  const filePathIndicators30m = `indicators_${symbol}_${timeframe30m}.csv`;

  const sessions = calculateVolumeProfile(sliceOHLCV, candlesPerSession);

  const timestamp = reversedArray.map((candle) => candle[0]);
  const open = reversedArray.map((candle) => candle[1]);
  const high = reversedArray.map((candle) => candle[2]);
  const low = reversedArray.map((candle) => candle[3]);
  const close = reversedArray.map((candle) => candle[4]);
  const volume = reversedArray.map((candle) => candle[5]);
  const reverseClose = [...close].reverse();
  const bbPeriod = 14;
  const smaPeriod = 50;
  const ema1Period = 55;
  const ema2Period = 400;
  const ema3Period = 800;
  const last = realTimePrice;
  const accumulatedLevels = [];
  const trends = [];

  const atrValues = ATR.calculate({ high, low, close, period: bbPeriod });
  const adxValues = ADX.calculate({ high, low, close, period: bbPeriod });
  const wemaValues = WEMA.calculate({ period: bbPeriod, values: atrValues });
  const vwapValues = VWAP.calculate({ high, low, close, volume });

  const ema1 = calculateEMA(reverseClose, ema1Period);
  const ema2 = calculateEMA(reverseClose, ema2Period);
  const ema3 = calculateEMA(reverseClose, ema3Period);
  const macd = calculateMACD(close);
  const bb = calculateBollingerBands(close);
  const spikes = getTRSpikes(reversedArray);
  saveIndicators30mToCsv(
    timestamp,
    bb,
    ema1,
    ema2,
    ema3,
    macd,
    spikes,
    filePathIndicators30m,
    true
  );

  const smoothedClose = kalmanFilter(close);
  const smoothedHigh = kalmanFilter(high);
  const smoothedLow = kalmanFilter(low);

  const regressionResult = linearRegressionSlope(smoothedClose);
  const singleTrend = fitTrendlinesSingle(smoothedClose);
  const highLowTrend = fitTrendlinesHighLow(
    smoothedHigh,
    smoothedLow,
    smoothedClose
  );

  function analyzeTrends(nCloses, iCloses, pastLevels = [], isCurrentSession) {
    // const latestPrice = nCloses[0];
    // // Reverse the levels to show the most recent first
    // const pastSessionsLevels = pastLevels.map((level) => ({
    //   poc: level.poc,
    //   val: level.val,
    //   vah: level.vah,
    // }));
    // let trend = "";
    // const vwapBands = calculateVWAPBands(vwapValues);
    // if (slope > 0) {
    //   trend = "uptrend";
    // } else if (slope < 0) {
    //   trend = "downtrend";
    // }
    // // Add results to trends array
    // trends.push({ trend, pastSessionsLevels });
    // return { trends };
  }

  // Computation for each session
  sessions.forEach((session, index) => {
    try {
      // Check if the current session is the one that was originally at index 0
      const isCurrentSession = index === sessions[0];
      const invertedSessionCloses = [...session.closePrices].reverse();
      const normalSessionCloses = session.closePrices;

      // Get the session's max and min prices
      const sessionMaxPrice = session.sessionHighestHigh;
      const sessionMinPrice = session.sessionLowestLow;
      const sessionPocPrice = session.pocPrice;
      const sessionVal = session.val;
      const sessionVah = session.vah;

      // Accumulate levels
      accumulatedLevels.push({
        poc: sessionPocPrice,
        val: sessionVal,
        vah: sessionVah,
      });

      // Create a new array that contains the current and past levels
      const currentAndPastLevels = [...accumulatedLevels];

      // Analyze trends with session-specific thresholds
      const trendAnalysis = analyzeTrends(
        normalSessionCloses,
        invertedSessionCloses,
        currentAndPastLevels,
        isCurrentSession
      );
    } catch (error) {
      console.error(`Error processing session ${index + 1}:`, error);
    }
  });

  return {
    openCandle: open[0],
    closeCandle: close[0],
    highCandle: high[0],
    lowCandle: low[0],
    volume: volume[0],
    previousOpenCandle: open[1],
    previousCloseCandle: close[1],
    previousHighCandle: high[1],
    previousLowCandle: low[1],
    previousVolume: volume[1],
    latestVWAP: vwapValues[0],
    latestATR: atrValues[0],
    latestADX: adxValues[0],
    latestBB: bb[0],
    last,
    ema1,
    ema2,
    ema3,
    sessions,
    trends,
  };
}
