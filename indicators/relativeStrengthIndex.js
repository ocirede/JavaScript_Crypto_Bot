import { calculateSMA } from "./smaCalculation.js";

export function calculateRSI(prices, period = 14) {
  if (prices.length < period) return [];

  let priceChanges = prices.slice(1).map((price, i) => price - prices[i]);

  let gains = priceChanges.map(change => (change > 0 ? change : 0));
  let losses = priceChanges.map(change => (change < 0 ? -change : 0));

  let avgGains = calculateSMA(gains, period);
  let avgLosses = calculateSMA(losses, period);
  

  let rsi = [];

  for (let i = 0; i < avgGains.length; i++) {
    if (avgLosses[i] !== 0) {
      const rs = avgGains[i] / avgLosses[i];
      rsi.push(100 - 100 / (1 + rs));
    } else {
      rsi.push(100);
    }
  }

  // Add padding for alignment
  return [...new Array(period - 1).fill(null), ...rsi];
}
