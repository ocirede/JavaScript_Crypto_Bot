import { calculateRetracementAndPivotPoints } from "./calculateRetracementLevels.js";
import { ATR, ADX, VWAP, WEMA } from "technicalindicators";
import { calculateEMA } from "./emaCalculation.js";
import { calculateVolumeProfile } from "./calculateVolumeProfile.js";
import { calculateThirdInstance, calculateMACD } from "./macdCalculation.js";
import { calculateBollingerBands } from "./bollingerBandsCalculation.js";
import { kalmanFilter } from "./kalmanFilter.js";
import { saveIndicatorsToCsv } from "../fetching_csv/saveIndicatorsToCsv.js";
import { calculateVWAPBands } from "./calculateVMAPBands.js";
import { getTRSpikes } from "./trueRange.js";
import {
  linearRegressionSlope,
  fitTrendlinesHighLow,
} from "./linearRegression.js";

export function calculate4hIndicators(arrayOfArrays ) {
  const symbol = "BTC-USDT";
  const timeframe4h = "4h";
  const filePathIndicators4h = `indicators_${symbol}_${timeframe4h}.csv`;
  const timestamp = arrayOfArrays.map((candle) => parseFloat(candle[0]));
  const open = arrayOfArrays.map((candle) => parseFloat(candle[1]));
  const high = arrayOfArrays.map((candle) => parseFloat(candle[2]));
  const low = arrayOfArrays.map((candle) => parseFloat(candle[3]));
  const close = arrayOfArrays.map((candle) => parseFloat(candle[4]));
  const volume = arrayOfArrays.map((candle) => parseFloat(candle[5]));
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
   // Compute Fibonacci retracement levels for the session
   const fibPivotsRetracement = calculateRetracementAndPivotPoints(
    timestamp,
    open,
    high,
    low,
    close
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
    filePathIndicators4h,
    true
  );

 

  return {fibPivotsRetracement};
}
