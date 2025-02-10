export function calculateStandardDeviation(values) {
  if (values.length < 2) return { mean: values[0] || 0, stdDev: 0, stdDevThreshold: values[0] || 0 };

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1)
  );
  const stdDevThreshold = mean + 1.5 * stdDev; 
  return { mean, stdDev, stdDevThreshold };
}
