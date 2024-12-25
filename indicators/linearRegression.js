// Function to calculate the linear regression slope and standard error
function linearRegressionSlope(iCloses) {
  const n = iCloses.length;
  const xSum = (n * (n - 1)) / 2;
  const ySum = iCloses.reduce((sum, price) => sum + price, 0);
  const xySum = iCloses.reduce((sum, price, i) => sum + i * price, 0);
  const xSquaredSum = (n * (n - 1) * (2 * n - 1)) / 6;

  // Calculate slope (m) using formula for least squares fit
  const slope = (n * xySum - xSum * ySum) / (n * xSquaredSum - xSum * xSum);

  // Calculate intercept (b)
  const intercept = (ySum - slope * xSum) / n;

  // Calculate residuals and sum of squared residuals
  const residuals = iCloses.map((price, i) => price - (slope * i + intercept));
  const residualsSquaredSum = residuals.reduce((sum, res) => sum + res ** 2, 0);

  // Calculate standard error of the regression
  const standardError = Math.sqrt(residualsSquaredSum / (n - 2));

  // Calculate best-fit values for each index
  const bestFitLine = iCloses.map((_, i) => slope * i + intercept);

  // Return result along with a prediction method
  return {
    slope,
    intercept,
    standardError,
    bestFitLine
  };
}

// Helper function to compute the sum of differences between line and prices
function checkTrendLine(isSupport, pivot, slope, y) {
  // Find the intercept of the line passing through the pivot point with the given slope
  const intercept = -slope * pivot + y[pivot];
  const lineVals = y.map((_, i) => slope * i + intercept);

  // Calculate differences between line values and data
  const diffs = lineVals.map((val, i) => val - y[i]);

  // Check if the line is valid
  if (isSupport && Math.max(...diffs) > 1e-5) {
    return -1.0;
  } else if (!isSupport && Math.min(...diffs) < -1e-5) {
    return -1.0;
  }

  // Calculate squared sum of differences
  const err = diffs.reduce((sum, diff) => sum + diff ** 2, 0);
  return err;
}
// Function to fit trendlines for a single dataset
function fitTrendlinesSingle(data) {
  const x = Array.from({ length: data.length }, (_, i) => i);
  const coefs = linearRegressionSlope(data, x);
  const linePoints = x.map((i) => coefs.slope * i + coefs.intercept);
  const upperPivot = data
    .map((val, i) => val - linePoints[i])
    .indexOf(Math.max(...data.map((val, i) => val - linePoints[i])));
  const lowerPivot = data
    .map((val, i) => val - linePoints[i])
    .indexOf(Math.min(...data.map((val, i) => val - linePoints[i])));

  const supportC = optimizeSlope(true, lowerPivot, coefs.slope, data);
  const resistC = optimizeSlope(false, upperPivot, coefs.slope, data);
  return { supportC, resistC };
}

// Function to optimize the slope for a trendline
 function optimizeSlope(isSupport, pivot, initSlope, y) {
  const slopeUnit = (Math.max(...y) - Math.min(...y)) / y.length;

  let optStep = 1.0;
  const minStep = 0.0001;
  let currStep = optStep;

  let bestSlope = initSlope;
  let bestErr = checkTrendLine(isSupport, pivot, initSlope, y);
  if (bestErr < 0)
    throw new Error("Initial slope resulted in invalid trendline.");

  let getDerivative = true;
  let derivative = null;

  while (currStep > minStep) {
    if (getDerivative) {
      // Numerical differentiation
      let slopeChange = bestSlope + slopeUnit * minStep;
      let testErr = checkTrendLine(isSupport, pivot, slopeChange, y);
      derivative = testErr - bestErr;

      if (testErr < 0) {
        slopeChange = bestSlope - slopeUnit * minStep;
        testErr = checkTrendLine(isSupport, pivot, slopeChange, y);
        derivative = bestErr - testErr;
      }

      if (testErr < 0) throw new Error("Derivative calculation failed.");
      getDerivative = false;
    }

    let testSlope =
      derivative > 0
        ? bestSlope - slopeUnit * currStep
        : bestSlope + slopeUnit * currStep;

    const testErr = checkTrendLine(isSupport, pivot, testSlope, y);
    if (testErr < 0 || testErr >= bestErr) {
      currStep *= 0.5;
    } else {
      bestErr = testErr;
      bestSlope = testSlope;
      getDerivative = true;
    }
  }

  const intercept = -bestSlope * pivot + y[pivot];
  return { slope: bestSlope, intercept };
}

// Function to fit trendlines using high, low, and close arrays
function fitTrendlinesHighLow(high, low, close) {
  const x = Array.from({ length: close.length }, (_, i) => i);
  const coefs = linearRegressionSlope(close, x); // Replace with your linear regression
  const linePoints = x.map((i) => coefs.slope * i + coefs.intercept);

  const upperPivot = high
    .map((val, i) => val - linePoints[i])
    .indexOf(Math.max(...high.map((val, i) => val - linePoints[i])));
  const lowerPivot = low
    .map((val, i) => val - linePoints[i])
    .indexOf(Math.min(...low.map((val, i) => val - linePoints[i])));

  const supportCoefs = optimizeSlope(true, lowerPivot, coefs.slope, low);
  const resistCoefs = optimizeSlope(false, upperPivot, coefs.slope, high);

  return { supportCoefs, resistCoefs };
}

export {
  linearRegressionSlope,
  checkTrendLine,
  fitTrendlinesHighLow,
  optimizeSlope,
  fitTrendlinesSingle,
};
