import {calculateStandardDeviation} from "./calculateStandardDeviation.js"

function computeTrueRange(high, low, prevClose) {
  return Math.max(
    high - low,
    Math.abs(high - prevClose),
    Math.abs(low - prevClose)
  );
}

export function getTRSpikes(ohlcvData) {
  const spikes = [];
  const parsedData = ohlcvData.map(
    ([timestamp, open, high, low, close, volume]) => ({
      timestamp: new Date(timestamp),
      open,
      high,
      low,
      close,
      volume,
    })
  );

  const trValues = [];
  for (let i = 1; i < parsedData.length; i++) {
    const { high, low, close } = parsedData[i];
    const prevClose = parsedData[i - 1].close;
    const tr = computeTrueRange(high, low, prevClose);
    trValues.push(tr);
  }

  const {strDevThreshols} = calculateStandardDeviation(trValues);

  for (let i = 1; i < parsedData.length; i++) {
    const tr = trValues[i - 1]; 
    const timestamp = parsedData[i].timestamp;
    
    if (tr > strDevThreshols) {
        spikes.push({
            timestamp: new Date(timestamp).toISOString(),
            trValue: tr, 
          });    }
  }



return spikes;
}
