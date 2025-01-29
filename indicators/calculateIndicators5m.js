import { calculateEMA } from "./emaCalculation.js";
import { calculateThirdInstance, calculateMACD } from "./macdCalculation.js";
import { calculateBollingerBands } from "./bollingerBandsCalculation.js";
import { kalmanFilter } from "./kalmanFilter.js";
import { saveIndicatorsToCsv } from "../fetching_csv/saveIndicatorsToCsv.js";
import { getTRSpikes } from "./trueRange.js";
import {
  linearRegressionSlope,
  fitTrendlinesHighLow,
} from "./linearRegression.js";

export function calculateIndicators5m(arrayOfArrays) {
  const symbol = "BTC-USDT";
  const timeframe5m = "5m";
  const filePathIndicators5m = `indicators_${symbol}_${timeframe5m}.csv`;

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

  const sessionsData = null;
  saveIndicatorsToCsv(
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
    sessionsData,
    spikes,
    filePathIndicators5m,
    true
  );

  return {
    macd: macd
  };
}
