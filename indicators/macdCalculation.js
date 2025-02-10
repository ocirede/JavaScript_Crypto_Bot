// Import your EMA and Bollinger Bands functions
import { calculateEMA } from "./emaCalculation.js";

// MACD Calculation
function calc_macd(close, fastLength, slowLength) {
  const fastMA = calculateEMA(close, fastLength);
  const slowMA = calculateEMA(close, slowLength);
  // Calculate MACD values by subtracting slowMA from fastMA
  const macd = fastMA.map((value, index) => value - slowMA[index]);
  return macd;
}

export function calculateThirdInstance(
  close,
  fastLength3,
  slowLength3,
  sensitivity3 = 100
) {
  // Check for valid data
  if (!Array.isArray(close) || close.length < 2) {
    console.error("Invalid close data:", close);
    return { trendUp3: [], trendDown3: [] };
  }
  if (isNaN(sensitivity3)) {
    console.error("Invalid sensitivity3:", sensitivity3);
    return { trendUp3: [], trendDown3: [] };
  }
  // Calculate the MACD for the entire close array
  const macdCurrent = calc_macd(close, fastLength3, slowLength3);
  // Initialize arrays for trendUp3 and trendDown3
  const trend = [];
  // Loop over the MACD values (start from the second value since we are comparing current and previous)
  for (let i = 0; i < macdCurrent.length; i++) {
    const macdPreviousValue = macdCurrent[i - 1];
    const macdCurrentValue = macdCurrent[i];
    // Calculate t3 (difference between current and previous MACD, then apply sensitivity)
    const t3 = (macdCurrentValue - macdPreviousValue) * sensitivity3;

    trend.push(t3);
  }

  return trend;
}

export function calculateMACD(close) {
  const macdFastLength = 5;
  const macdSlowLength = 400;
  const macdSignalLength = 50;
  // Calculate the MACD line (fast EMA - slow EMA)
  const fastEMA = calculateEMA(close, macdFastLength);
  const slowEMA = calculateEMA(close, macdSlowLength);
  // Ensure the arrays are aligned to avoid index errors
  const macdLine = fastEMA.map((value, index) => value - slowEMA[index]);
  // Calculate the Signal line (EMA of the MACD line)
  const signalLine = calculateEMA(macdLine, macdSignalLength);
  // Calculate the Histogram (MACD line - Signal line)
  const histogram = macdLine.map((value, index) => value - signalLine[index]);

  return { macdLine, signalLine, histogram };
}
