import { calculateEMA } from "./emaCalculation.js";

// MACD Calculation
function calc_macd(close, fastLength, slowLength) {
  const fastMA = calculateEMA(close, fastLength);
  const slowMA = calculateEMA(close, slowLength);

  const macd = fastMA.map((value, index) => value - slowMA[index]);

  return { macd };
}

export function calculateThirdInstance(
  close,
  fastLength3,
  slowLength3,
  sensitivity3 = 100
) {
  if (!Array.isArray(close) || close.length < 2) {
    console.error("Invalid close data:", close);
    return [];
  }
  if (isNaN(sensitivity3)) {
    console.error("Invalid sensitivity3:", sensitivity3);
    return [];
  }

  const { macd } = calc_macd(close, fastLength3, slowLength3);
  // Calculate differences for t3 values (using the same range for both current and previous)
  const t3 = macd.map((value, i) => {
    if (i === 0) return 0; // First value remains 0 (or handle as needed)
    const diff = value - macd[i - 1];

    return diff * sensitivity3;
  });

  // Implement trendUp1 and trendDown1 logic
  const trendUp1 = t3.map((value) => (value >= 0 ? value : 0));
  const trendDown1 = t3.map((value) => (value < 0 ? value : 0));

  // Optional: Handle the last value to avoid extreme fluctuations
  const lastValue = t3[t3.length - 1];
  if (Math.abs(lastValue) > 100000) {
    console.warn("Last value is extremely high, adjusting:", lastValue);
    t3[t3.length - 1] = 0; // Adjust or set to a default value
  }

  return { t3, trendUp1, trendDown1 };
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
