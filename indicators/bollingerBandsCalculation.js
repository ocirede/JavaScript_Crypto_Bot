export function calculateBollingerBands(close, period = 20, multiplier = 2.5) {
  
  const reversedClose = close.slice().reverse()
  
  
  // Helper function to calculate SMA
  function calculateSMA(prices, period) {
    let sma = [];
    for (let i = 0; i <= prices.length ; i++) {
      const sum = prices
        .slice(i, i + period)
        .reduce((acc, val) => acc + val, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  // Helper function to calculate Standard Deviation
  function calculateStandardDeviation(prices, period, sma) {
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
