
// Helper function to calculate EMA

export function calculateEMA(data, period) {
  const alpha = 2 / (period + 1);
  let ema = [];
  data.forEach((value, index) => {
    if (index === 0) {
      ema.push(value); // Initial EMA is the first value
    } else {
      ema.push(alpha * value + (1 - alpha) * ema[index - 1]);
    }
  });
  return ema.reverse();
}

