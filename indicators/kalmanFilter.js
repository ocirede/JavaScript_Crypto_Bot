  // Kalman Filter for cryptocurrency trend estimation
  export function kalmanFilter(prices, processNoise = 1e-5, measurementNoise = 1) {
    const n = prices.length;

    // Initialize the Kalman Filter parameters
    let estimate = prices[0]; // initial estimate (first price)
    let estimateError = 1; // initial uncertainty
    let trend = 0; // initial trend estimate

    // Array to store the smoothed trend estimates
    const filteredPrices = [];

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
      trend = (prices[i] - estimate) * 0.1; // Adjust trend based on the price change
    }

    return filteredPrices;
  }
