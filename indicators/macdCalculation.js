export function calculateMACD(close, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) {
    // Helper function to calculate EMA
    function calculateEMA(prices, period) {
      const multiplier = 2 / (period + 1);
      let ema = [];
      let prevEma = prices[0]; // Initialize EMA with the first close price
      ema.push(prevEma);
  
      for (let i = 1; i < prices.length; i++) {
        prevEma = (prices[i] - prevEma) * multiplier + prevEma;
        ema.push(prevEma);
      }
  
      return ema;
    }
  
    // Calculate EMAs
    const shortEMA = calculateEMA(close, shortPeriod);
    const longEMA = calculateEMA(close, longPeriod);
  
    // Calculate MACD line
    const macd = close.map((_, i) => shortEMA[i] - longEMA[i]);
  
    // Calculate Signal line (EMA of MACD)
    const signal = calculateEMA(macd, signalPeriod);
  
    // Calculate Histogram
    const histogram = macd.map((value, i) => value - signal[i]);
  
    return { MACD: macd, signal, histogram };
  }
  