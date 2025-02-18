import { calculateSMA } from "./smaCalculation.js";

export function calculateRSI(prices, period = 14) {
  if (prices.length < period) return [];

  // Calculate daily price changes
  let priceChanges = prices.slice(1).map((price, i) => price - prices[i]);

  // Calculate gains and losses
  let gains = priceChanges.map(change => (change > 0 ? change : 0));
  let losses = priceChanges.map(change => (change < 0 ? -change : 0));

  // Calculate the average gains and losses using SMA
  let avgGains = calculateSMA(gains, period);
  let avgLosses = calculateSMA(losses, period);

  // Calculate RSI
  let rsi = [];
  for (let i = 0; i < avgGains.length; i++) {
    if (avgLosses[i] !== 0) {
      const rs = avgGains[i] / avgLosses[i];
      rsi.push(100 - 100 / (1 + rs));
    } else {
      rsi.push(100);
    }
  }

  
  return rsi; 
}
