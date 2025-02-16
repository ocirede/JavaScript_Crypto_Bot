import {calculateSMA} from "./smaCalculation.js"

export function calculateRSI(prices, period = 21) {
  if (prices.length < period) return [];

 

  // Calculate daily price changes
  let priceChanges = [];
  for (let i = 1; i < prices.length; i++) {
    priceChanges.push(prices[i] - prices[i - 1]);
  }

  // Calculate gains and losses
  let gains = priceChanges.map(change => (change > 0 ? change : 0));
  let losses = priceChanges.map(change => (change < 0 ? -change : 0));

  // Calculate the average gains and losses using SMA
  let avgGains = calculateSMA(gains, period);
  let avgLosses = calculateSMA(losses, period);

  // Calculate RSI
  const rsi = [];
  for (let i = period - 1; i < prices.length; i++) {
    if (avgLosses[i] !== 0) {
      const rs = avgGains[i] / avgLosses[i];
      const rsiValue = 100 - 100 / (1 + rs);
      rsi.push(rsiValue);
    } else {
      rsi.push(100); 
    }
  }

  // Prepend `null` for the first `period - 1` periods
  while (rsi.length < prices.length) {
    rsi.unshift(null);
  }

  return rsi;
}
