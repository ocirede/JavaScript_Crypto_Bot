import {  ADX, VWAP, WEMA } from "technicalindicators";
import { calculateEMA } from "../indicators/emaCalculation.js";
import { calculateVolumeProfile } from "../indicators/calculateVolumeProfile.js";
import { calculateThirdInstance, calculateMACD } from "../indicators/macdCalculation.js";
import { calculateBollingerBands } from "../indicators/bollingerBandsCalculation.js";
import { kalmanFilter } from "../indicators/kalmanFilter.js";
import { saveIndicatorsToCsv } from "../fetching/saveIndicatorsToCsv.js";
import { calculateVWAPBands } from "../indicators/calculateVMAPBands.js";
import { processTradingSignals } from "../indicators/hawkesProcess.js";
import {
  linearRegressionSlope,
  fitTrendlinesHighLow,
} from "../indicators/linearRegression.js";
import { calculateRetracementAndPivotPoints } from "../indicators/calculateRetracementLevels.js";

// Calculate technical indicators
export function calculate30mIndicators(arrayOfArrays ) {
  const sliceOHLCV = arrayOfArrays.slice(0, 56);
  const candlesPerSession = 14;
  const symbol = "BTC-USDT";
  const timeframe30m = "30m";
  const filePathIndicators30m = `indicators_${symbol}_${timeframe30m}.csv`;

  const sessionsData = calculateVolumeProfile(sliceOHLCV, candlesPerSession);

  const timestamp = arrayOfArrays.map((candle) => candle[0]);
  const open = arrayOfArrays.map((candle) => candle[1]);
  const high = arrayOfArrays.map((candle) => candle[2]);
  const low = arrayOfArrays.map((candle) => candle[3]);
  const close = arrayOfArrays.map((candle) => candle[4]);
  const volume = arrayOfArrays.map((candle) => candle[5]);
  
  const period = 14;
  const ema1Period = 50;
  const ema2Period = 400;
  const ema3Period = 800;
  const fastLength3 = 400;
  const slowLength3 = 800;

  const adxValues = ADX.calculate({ high, low, close, period: period });
  const hawkesProcess = processTradingSignals(arrayOfArrays);
  //const wemaValues = WEMA.calculate({ period: period, values: atrValues });
  const vwapValues = VWAP.calculate({ high, low, close, volume });

  const ema1 = calculateEMA(close, ema1Period);
  const ema2 = calculateEMA(close, ema2Period);
  const ema3 = calculateEMA(close, ema3Period);
  const macd = calculateMACD(close);
  const trend = calculateThirdInstance(
    close,
    fastLength3,
    slowLength3,
    100
  );
  const bb = calculateBollingerBands(close);
  const smoothedClose = kalmanFilter(close);
  const smoothedHigh = kalmanFilter(high);
  const smoothedLow = kalmanFilter(low);
  const regressionResult = linearRegressionSlope(smoothedClose);
  const bestFitLine = regressionResult.bestFitLine;
  const { supportLine, resistLine } = fitTrendlinesHighLow(
    smoothedHigh,
    smoothedLow,
    smoothedClose
  );
   // Compute Fibonacci retracement levels for the session
   let fibPivotsRetracement = calculateRetracementAndPivotPoints(
    timestamp,
    open,
    high,
    low,
    close
  );

  //const hawkesProcess = null
  saveIndicatorsToCsv(
    timestamp,
    close,
    bb,
    ema1,
    ema2,
    ema3,
    macd,
    trend,
    smoothedClose,
    bestFitLine,
    supportLine,
    resistLine,
    hawkesProcess,
    filePathIndicators30m,
    true
  );
  
  return {
    timestamp: timestamp,
    open: open,
    close: close,
    high: high,
    low: low,
    bollingherBands: bb,
    ema55: ema1,
    ema400: ema2,
    ema800: ema3,
    macd: macd,
    macdTrend: trend,
    regressionLine: bestFitLine,
    supportLine: supportLine,
    resistanceLine: resistLine,
    //hawkesProcess: hawkesProcess,
  };
}
