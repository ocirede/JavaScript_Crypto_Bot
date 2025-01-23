// CalculateVolumeProfle
export function calculateVolumeProfile(
  ohlcv,
  candlesPerSession,

) {
  const sessionProfiles = [];

  // Loop through OHLCV data (assuming it's already sorted)
  for (let i = 0; i < ohlcv.length; i += candlesPerSession) {
    const sessionData = ohlcv.slice(i, i + candlesPerSession);
    
    const volumeProfile = new Map();
    let totalVolume = 0;
    let closePrices = [];
    let timestamps = [];
    const bucketSizePercentage = 0.005;
    let sessionLowestLow = [];
    let sessionHighestHigh = [];

    // Calculate overall session high and low
    let lowestLow = sessionData.map((data) => data[3]);
    let highestHigh = sessionData.map((data) => data[2]);

    // Calculate price range based on overall session high and low
    const priceRangeStart =
      Math.floor(Math.min(...lowestLow) / bucketSizePercentage) *
      bucketSizePercentage;
    const priceRangeEnd =
      Math.ceil(Math.max(...highestHigh) / bucketSizePercentage) *
      bucketSizePercentage;

    sessionLowestLow.push(priceRangeStart);
    sessionHighestHigh.push(priceRangeEnd);

    // Accumulate volume into price buckets
    sessionData.forEach((data) => {
      const timestamp = data[0];
      const open = data[1]; 
      const high = data[2]; 
      const low = data[3]; 
      const close = data[4]; 
      const volume = data[5];    
       closePrices.push(close);
       timestamps.push(timestamp)
      totalVolume += volume;

      for (
        let price = priceRangeStart;
        price <= priceRangeEnd;
        price += bucketSizePercentage
      ) {
        if (!volumeProfile.has(price)) {
          volumeProfile.set(price, 0);
        }

        // Distribute volume evenly across the bucket range for the candle
        const overlap = Math.max(
          0,
          Math.min(price + bucketSizePercentage, high) - Math.max(price, low)
        );
        if (overlap > 0) {
          volumeProfile.set(
            price,
            volumeProfile.get(price) + volume * (overlap / (high - low))
          );
        }
      }
    });


    // Find the Point of Control (POC) - highest volume price level
    let pocPrice = null;
    let maxVolume = 0;
    volumeProfile.forEach((vol, price) => {
      if (vol > maxVolume) {
        maxVolume = vol;
        pocPrice = price;
      }
    });

    // Sort prices into above and below POC
    const sortedPrices = Array.from(volumeProfile.keys()).sort((a, b) => a - b);
    const abovePOC = sortedPrices.filter((price) => price >= pocPrice);
    const belowPOC = sortedPrices.filter((price) => price < pocPrice).reverse();

    // Cumulative volume calculation
    let cumulativeVolume = 0;
    let vah = null;
    let val = null;

    // Calculate VAH (Value Area High)
    for (let price of abovePOC) {
      cumulativeVolume += volumeProfile.get(price);
      if (!vah && cumulativeVolume / totalVolume >= 0.7) {
        vah = price;
        break;
      }
    }

    // Reset cumulative volume for VAL (Value Area Low)
    cumulativeVolume = 0;

    // Calculate VAL (Value Area Low)
    for (let price of belowPOC) {
      cumulativeVolume += volumeProfile.get(price);
      if (!val && cumulativeVolume / totalVolume >= 0.3) {
        val = price;
        break;
      }
    }

    // Fallback for VAH and VAL
    if (vah === null && abovePOC.length > 0) {
      vah = abovePOC[abovePOC.length - 1];
    }
    if (val === null && belowPOC.length > 0) {
      val = belowPOC[belowPOC.length - 1];
    }

    sessionProfiles.push({
      timestamps,
      pocPrice,
      vah,
      val,
    });
  }

  return sessionProfiles;
}
