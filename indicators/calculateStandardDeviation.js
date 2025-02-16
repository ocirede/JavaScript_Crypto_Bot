  // Helper function to calculate Standard Deviation
  export function calculateStandardDeviation(prices, period, sma) {
    let stdDev = [];
    for (let i = 0; i <= prices.length ; i++) {
      const subset = prices.slice(i, i + period);
      const mean = sma[i];
      const variance =
        subset.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
      stdDev.push(Math.sqrt(variance));
    }
    return stdDev;
  }