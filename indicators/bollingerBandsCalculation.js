import { calculateSMA } from "./smaCalculation.js";
import { calculateStandardDeviation } from "./calculateStandardDeviation.js";

export function calculateBollingerBands(close, period = 20, multiplier = 2.5) {
  const reversedClose = close.slice().reverse();

  // Calculate SMA
  const sma = calculateSMA(reversedClose, period);

  // Calculate Standard Deviation
  const stdDev = calculateStandardDeviation(reversedClose, period, sma);

  // Calculate Bollinger Bands
  const middle = sma;

  const upper = sma.map((value, i) => value + multiplier * stdDev[i]);
  const lower = sma.map((value, i) => value - multiplier * stdDev[i]);
  // Calculate %B (Position of close price within the bands)
  const pb = close.slice(period - 1).map((price, i) => {
    return (price - lower[i]) / (upper[i] - lower[i]);
  });

  // Reverse the results to match the chronological order (oldest to newest)
  return {
    middle: middle.reverse(),
    upper: upper.reverse(),
    lower: lower.reverse(),
    pb: pb.reverse(),
  };
}
