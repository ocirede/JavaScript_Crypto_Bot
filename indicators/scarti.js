// rsi pattern indicator
function detectConfirmedRsiSignals(
    rsiData,
    close,
    proximity = 10,
    confirmationCandles = 10
  ) {
    let overboughtSignals = [];
    let oversoldSignals = [];

    for (let i = 1; i < rsiData.length - 1; i++) {
      // Check for potential oversold condition (RSI < 30)
      if (rsiData[i] < 30) {
        let isLocalMin = true;

        // Ensure it's a local minimum
        for (let j = 1; j <= proximity; j++) {
          if (i - j >= 0 && rsiData[i] >= rsiData[i - j]) {
            isLocalMin = false;
            break;
          }
          if (i + j < rsiData.length && rsiData[i] >= rsiData[i + j]) {
            isLocalMin = false;
            break;
          }
        }

        // If local minimum, check for price confirmation (must move up)
        if (isLocalMin) {
          let confirmed = false;
          for (let k = 1; k <= confirmationCandles; k++) {
            if (i + k < close.length && close[i + k] > close[i]) {
              confirmed = true;
              break;
            }
          }

          if (confirmed) {
            oversoldSignals.push({
              index: i,
              signal: "oversold",
              closePrice: close[i],
            });
          }
        }
      }

      // Check for potential overbought condition (RSI > 70)
      if (rsiData[i] > 70) {
        let isLocalMax = true;

        // Ensure it's a local maximum
        for (let j = 1; j <= proximity; j++) {
          if (i - j >= 0 && rsiData[i] <= rsiData[i - j]) {
            isLocalMax = false;
            break;
          }
          if (i + j < rsiData.length && rsiData[i] <= rsiData[i + j]) {
            isLocalMax = false;
            break;
          }
        }

        // If local maximum, check for price confirmation (must move down)
        if (isLocalMax) {
          let confirmed = false;
          for (let k = 1; k <= confirmationCandles; k++) {
            if (i + k < close.length && close[i + k] < close[i]) {
              confirmed = true;
              break;
            }
          }

          if (confirmed) {
            overboughtSignals.push({
              index: i,
              signal: "overbought",
              closePrice: close[i],
            });
          }
        }
      }
    }

    return { overboughtSignals, oversoldSignals };
  };
  const rsiPattern = detectConfirmedRsiSignals(rsi, close);
   

    // Helper function to find the highest price near resistance
    const findHighestNearResistance = () => {
      let priceRarray = [];
      let currentHigh = -Infinity;
      let currentLow = Infinity;

      const highestNearResistance = close.reduce(
        (acc, price, index) => {
          const distanceToResistance = [
            Math.abs(price - resistanceLine[index]),
          ];

          // Get the minimum distance
          const closest = Math.min(acc.closestD, distanceToResistance);

          if (closest < acc.closestD) {
            return {
              highestPrice: price,
              closestD: distanceToResistance,
              latestI: index,
            };
          }

          return acc;
        },
        { highestPrice: null, closestD: Infinity, latestI: -1 }
      );

      // Iterate over the priceRarray to find the max and min prices
      priceRarray.forEach((price) => {
        if (price > currentHigh) currentHigh = price;
        if (price < currentLow) currentLow = price;
      });

      return { highestNearResistance, currentHigh, currentLow };
    };

    // Find the highest price near resistance
    const { highestNearResistance, currentHigh, currentLow } =
      findHighestNearResistance();
    const { highestPrice, closestD, latestI } = highestNearResistance;

    // Helper function to find the lowest price near the regression line
    const findLowestNearRegressionLine = () => {
      let priceBarray = [];
      let cHigh = -Infinity;
      let cLow = Infinity;

      const lowestNearBestfitLine = close.reduce(
        (acc, price, index) => {
          const distanceToBestfitLine = Math.abs(price - regressionLine[index]);

          const closest = Math.min(acc.cDistance, distanceToBestfitLine);

          // Update lowest price only if it's lower OR if it's the latest recorded one
          if (closest < acc.cDistance) {
            return {
              lPrice: price,
              cDistance: distanceToBestfitLine,
              lIndex: index,
            };
          }

          return acc;
        },
        { lPrice: Infinity, cDistance: Infinity, lIndex: -1 }
      );

      // Find the actual highest and lowest prices from the recorded ones
      priceBarray.forEach((price) => {
        if (price > cHigh) cHigh = price;
        if (price < cLow) cLow = price;
      });

      return { lowestNearBestfitLine, cHigh, cLow };
    };

    // Find the lowest price near the regression line
    const { lowestNearBestfitLine, cHigh, cLow } =
      findLowestNearRegressionLine();
    const { lPrice, cDistance, lIndex } = lowestNearBestfitLine;

    // Helper function to find the lowest price near the support line
    const findLowestNearSupportLine = () => {
      let priceSarray = [];
      let currentH = -Infinity;
      let currentL = Infinity;

      const lowestNearSupportLine = close.reduce(
        (acc, price, index) => {
          const distanceToSupportLine = Math.abs(price - supportLine[index]);

          // Store prices near the support line
          priceSarray.push(price);

          // Always update with the latest price that is closest to support
          if (
            index > acc.latestIndex ||
            distanceToSupportLine < acc.closestDistance
          ) {
            return {
              lowestPrice: price, // Update with latest closest price
              closestDistance: distanceToSupportLine,
              latestIndex: index,
            };
          }

          return acc;
        },
        { lowestPrice: null, closestDistance: Infinity, latestIndex: -1 }
      );

      // Find actual highest and lowest from the collected near-support prices
      priceSarray.forEach((price) => {
        if (price > currentH) currentH = price;
        if (price < currentL) currentL = price;
      });

      return { lowestNearSupportLine, currentH, currentL };
    };

    // Find the lowest price near the support line
    const { lowestNearSupportLine, currentH, currentL } =
      findLowestNearSupportLine();
    const { lowestPrice, closestDistance, latestIndex } = lowestNearSupportLine;