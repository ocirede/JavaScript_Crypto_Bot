export function calculateStandardDeviation(prices, period, sma) {
  let stdDev = [];
  for (let i = period - 1; i < prices.length; i++) {
      const subset = prices.slice(i - period + 1, i + 1); 
      const mean = sma[i]; 
      const variance =
          subset.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
      stdDev.push(Math.sqrt(variance));
  }

  // Add 'null' values for the first 'period - 1' elements where the stdDev can't be calculated
  const initialNulls = new Array(period - 1).fill(null);
  return initialNulls.concat(stdDev);  
}
