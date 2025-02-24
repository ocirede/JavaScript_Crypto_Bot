import { calculateSMA } from "./smaCalculation.js";
import { calculateStandardDeviation } from "./calculateStandardDeviation.js";

export function calculateBollingerBands(close, period = 20, multiplier = 2) {
  // Ensure there is enough data
  if (close.length < period) {
    console.error("Insufficient data for Bollinger Bands calculation");
    return;
  }

  // Calculate SMA for Bollinger Bands
  const sma = calculateSMA(close, period);

  // Calculate Standard Deviation for Bollinger Bands
  const stdDev = calculateStandardDeviation(close, period, sma);

  // Calculate Bollinger Bands
  const middle = sma;
  const upper = sma.map((value, i) => value + multiplier * stdDev[i]);
  const lower = sma.map((value, i) => value - multiplier * stdDev[i]);

  // Calculate %B (Position of close price within the bands)
  const pb = close.map((price, i) => {
    if (i < period - 1) return null;
    return (price - lower[i]) / (upper[i] - lower[i]);
  });

  // Return both the Bollinger Bands and the Trend Indicator numerical values
  return {
    middle: middle,
    upper: upper,
    lower: lower,
    pb: pb,
  };
}
