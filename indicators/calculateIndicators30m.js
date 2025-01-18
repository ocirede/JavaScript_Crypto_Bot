import { ATR, ADX, VWAP, WEMA } from "technicalindicators";
import { calculateEMA } from "./emaCalculation.js";
import { calculateVolumeProfile } from "./calculateVolumeProfile.js";
import { calculateThirdInstance, calculateMACD } from "./macdCalculation.js";
import { calculateBollingerBands } from "./bollingerBandsCalculation.js";
import { kalmanFilter } from "./kalmanFilter.js";
import { realTimePrice } from "../servers/webSocket.js";
import { saveIndicators30mToCsv } from "../fetching_csv/saveIndicators30mToCsv.js";
import { calculateVWAPBands } from "./calculateVMAPBands.js";
import { getTRSpikes } from "./trueRange.js";
import {
  linearRegressionSlope,
  fitTrendlinesHighLow,
} from "./linearRegression.js";

// Calculate technical indicators
export function calculate30mIndicators({ arrayOfArrays }) {
  const sliceOHLCV = arrayOfArrays.slice(0, 56);
  const candlesPerSession = 14;
  const symbol = "BTC-USDT";
  const timeframe30m = "30m";
  const filePathIndicators30m = `indicators_${symbol}_${timeframe30m}.csv`;

  const sessions = calculateVolumeProfile(sliceOHLCV, candlesPerSession);

  const timestamp = arrayOfArrays.map((candle) => candle[0]);
  const open = arrayOfArrays.map((candle) => candle[1]);
  const high = arrayOfArrays.map((candle) => candle[2]);
  const low = arrayOfArrays.map((candle) => candle[3]);
  const close = arrayOfArrays.map((candle) => candle[4]);
  const volume = arrayOfArrays.map((candle) => candle[5]);
  const reverseClose = [...close].reverse();
  const reverseHigh = [...high].reverse();
  const reverseLow = [...low].reverse();
  const period = 14;
  const ema1Period = 50;
  const ema2Period = 400;
  const ema3Period = 800;
  const fastLength3 = 400;
  const slowLength3 = 800;
  const last = realTimePrice;
  const accumulatedLevels = [];
  const trends = [];

  const atrValues = ATR.calculate({ high, low, close, period: period });
  const adxValues = ADX.calculate({ high, low, close, period: period });
  const wemaValues = WEMA.calculate({ period: period, values: atrValues });
  const vwapValues = VWAP.calculate({ high, low, close, volume });

  const ema1 = calculateEMA(reverseClose, ema1Period);
  const ema2 = calculateEMA(reverseClose, ema2Period);
  const ema3 = calculateEMA(reverseClose, ema3Period);
  const macd = calculateMACD(reverseClose);
  const trend = calculateThirdInstance(
    reverseClose,
    fastLength3,
    slowLength3,
    100
  );
  const bb = calculateBollingerBands(reverseClose);
  const spikes = getTRSpikes(arrayOfArrays);
  const smoothedClose = kalmanFilter(reverseClose);
  const smoothedHigh = kalmanFilter(reverseHigh);
  const smoothedLow = kalmanFilter(reverseLow);
  const regressionResult = linearRegressionSlope(smoothedClose);
  const bestFitLine = regressionResult.bestFitLine;
  const { supportLine, resistLine } = fitTrendlinesHighLow(
    smoothedHigh,
    smoothedLow,
    smoothedClose
  );
  saveIndicators30mToCsv(
    timestamp,
    bb,
    ema1,
    ema2,
    ema3,
    macd,
    smoothedClose,
    bestFitLine,
    supportLine,
    resistLine,
    trend,
    spikes,
    filePathIndicators30m,
    true
  );

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
