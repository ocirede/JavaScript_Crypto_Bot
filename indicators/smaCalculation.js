 // Helper function to calculate SMA
export  function calculateSMA(prices, period) {
    let sma = [];
    for (let i = 0; i < prices.length; i++) {
      if (i >= period - 1) {
        const sum = prices
          .slice(i - period + 1, i + 1)
          .reduce((acc, val) => acc + val, 0);
        sma.push(sum / period);
      } else {
        sma.push(null); 
      }
    }
    return sma;
  }