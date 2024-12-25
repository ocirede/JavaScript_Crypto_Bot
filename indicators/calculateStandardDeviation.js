// Standard deviation calculation
export function calculateStandardDeviation(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const strDev = Math.sqrt(
      values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (values.length - 1)
    );
    const strDevThreshols =  mean + 1.5 * strDev;
  
    return {mean, strDev, strDevThreshols};
  }