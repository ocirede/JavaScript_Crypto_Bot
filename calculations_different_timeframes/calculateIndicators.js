import { calculateEMA } from "../indicators/emaCalculation.js";
import {
  calculateThirdInstance,
  calculateMACD,
} from "../indicators/macdCalculation.js";
import { calculateBollingerBands } from "../indicators/bollingerBandsCalculation.js";
import { kalmanFilter } from "../indicators/kalmanFilter.js";
import { saveIndicatorsToCsv } from "../fetching/saveIndicatorsToCsv.js";
import {
  linearRegressionSlope,
  fitTrendlinesHighLow,
} from "../indicators/linearRegression.js";
import { calculateATR } from "../indicators/calculateAtr.js";
import { calculateRSI } from "../indicators/relativeStrengthIndex.js";
import { calculateADX } from "../indicators/calculateAdx.js";

export function calculateIndicators(arrayOfArrays, timeframe) {
  const symbol = "BTC-USDT";
  const filePathIndicators = `indicators_${symbol}_${timeframe}.csv`;
  const timestamp = arrayOfArrays.map((candle) => candle[0]);
  const open = arrayOfArrays.map((candle) => candle[1]);
  const high = arrayOfArrays.map((candle) => candle[2]);
  const low = arrayOfArrays.map((candle) => candle[3]);
  const close = arrayOfArrays.map((candle) => candle[4]);
  const volume = arrayOfArrays.map((candle) => candle[5]);
  const ema1Period = 50;
  const ema2Period = 400;
  const ema3Period = 800;
  const fastLength3 = 400;
  const slowLength3 = 800;
  const basedPeriod = 21;

  const ema1 = calculateEMA(close, ema1Period);
  const ema2 = calculateEMA(close, ema2Period);
  const ema3 = calculateEMA(close, ema3Period);
  const macd = calculateMACD(close);
  const {t3} = calculateThirdInstance(close, fastLength3, slowLength3);
  const bb = calculateBollingerBands(close);
  const smoothedClose = kalmanFilter(close);
  const smoothedHigh = kalmanFilter(high);
  const smoothedLow = kalmanFilter(low);
  const { slope, bestFitLine } = linearRegressionSlope(smoothedClose);

  const { supportLine, resistLine } = fitTrendlinesHighLow(
    smoothedHigh,
    smoothedLow,
    smoothedClose
  );

  const { atr, avgATR, smoothedAtr } = calculateATR(
    high,
    low,
    close,
    basedPeriod
  );

  const rsi = calculateRSI(close);
  const { adx } = calculateADX(high, low, close, basedPeriod);
  saveIndicatorsToCsv(
    timestamp,
    close,
    bb,
    ema1,
    ema2,
    ema3,
    macd,
    t3,
    smoothedClose,
    bestFitLine,
    supportLine,
    resistLine,
    atr,
    adx,
    rsi,
    filePathIndicators,
    true
  );

  return {
    timestamp: timestamp,
    open: open,
    close: close,
    high: high,
    low: low,
    volume: volume,
    bollingherBands: bb,
    ema55: ema1,
    ema400: ema2,
    ema800: ema3,
    macd: macd,
    macdTrend: t3,
    regressionLine: bestFitLine,
    supportLine: supportLine,
    slope: slope,
    resistanceLine: resistLine,
    atr: atr,
    avgAtr: avgATR,
    adx: adx,
    atrSlope: smoothedAtr,
    rsi: rsi,
  };
}
