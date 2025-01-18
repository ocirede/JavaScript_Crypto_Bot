  // Kalman Filter for cryptocurrency trend estimation
  export function kalmanFilter(prices, processNoise = 1e-3, measurementNoise = 0.5) {
    const n = prices.length;

    // Initialize the Kalman Filter parameters
    let estimate = prices[0]; 
    let estimateError = 1; 
    let trend = 0; 

    // Array to store the smoothed trend estimates
    const filteredPrices = [prices[0]]; 

    // Apply the Kalman filter iteratively
    for (let i = 1; i < n; i++) {
      // Prediction Step
      let predictedEstimate = estimate + trend;
      let predictedError = estimateError + processNoise;

      // Kalman Gain Calculation
      let kalmanGain = predictedError / (predictedError + measurementNoise);

      // Update Step
      estimate =
        predictedEstimate + kalmanGain * (prices[i] - predictedEstimate);
      estimateError = (1 - kalmanGain) * predictedError;

      // Store the filtered estimate (smoothed trend)
      filteredPrices.push(estimate);

      // Update the trend (adjust based on the difference)
      trend = trend + 0.1 * kalmanGain * (prices[i] - predictedEstimate);
    }

    return filteredPrices.reverse();

  }
