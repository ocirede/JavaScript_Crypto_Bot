import { hawkesProcess } from "./hawkesProcess.js";

function calculateATR(highs, lows, closes, period = 48, ) {
  let tr = [];
  let atr = [];
  let normRange = [];

  for (let i = 1; i < highs.length; i++) {
    let highLow = highs[i] - lows[i];
    let highClose = Math.abs(highs[i] - closes[i - 1]);
    let lowClose = Math.abs(lows[i] - closes[i - 1]);

    tr.push(Math.max(highLow, highClose, lowClose));
  }

  if (tr.length < period) {
    console.error("Not enough data to calculate ATR");
    return { atr: [], normRange: [] };
  }

  // First ATR is a simple average of the first 'period' True Range values
  let firstATR =
    tr.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  atr.push(firstATR);

  // Smooth ATR using the formula: ATR[i] = (ATR[i-1] * (period - 1) + TR[i]) / period
  for (let i = period; i < tr.length; i++) {
    let currentATR = (atr[atr.length - 1] * (period - 1) + tr[i]) / period;
    atr.push(currentATR);
  }

  // **Shift ATR forward to keep latest data intact**
  while (atr.length < highs.length) {
    atr.unshift(null);
  }

  // Align normRange correctly with ATR and original data
  for (let i = 0; i < highs.length; i++) {
    if (atr[i] === null || atr[i] === 0) {
      normRange.push(null); // Keep index alignment
    } else {
      normRange.push((Math.log(highs[i]) - Math.log(lows[i])) / atr[i]);
    }
  }

 

  return { atr };
}

export function calculateATRWithHawkes(
  highs,
  lows,
  closes,
  timestamps,
  basePeriod 
) {
  // Extract events for Hawkes process
  let events = highs
    .map((h, i) => (h - lows[i] > closes[i] * 0.01 ? timestamps[i] : null))
    .filter((e) => e);

  // Apply Hawkes process to get intensity
  let hawkesIntensity = hawkesProcess(events);
  let avgIntensity = hawkesIntensity.length
    ? hawkesIntensity.reduce((a, b) => a + b, 0) / hawkesIntensity.length
    : 1;

  // Adjust ATR period based on intensity
  let dynamicPeriod = Math.max(
    20,
    Math.min(basePeriod, Math.floor(basePeriod / avgIntensity))
  );

  // Calculate ATR
  let atrResult = calculateATR(highs, lows, closes, dynamicPeriod);
  let atr = atrResult.atr; // ATR already has nulls at the start

  let clusteredVolatility = [];
  let avgATR = atr.reduce((sum, val) => sum + (val || 0), 0) / atr.length;

  for (let i = basePeriod; i < atr.length; i++) {
    let currentATR = atr[i];
    
    // Dynamic cluster size based on ATR spikes
    let dynamicClusterSize = Math.max(
      20, // Minimum window size
      Math.floor((currentATR / avgATR) * basePeriod) // Scale dynamically
    );

    let windowAtr = atr.slice(Math.max(0, i - dynamicClusterSize), i);
    let validAtr = windowAtr.filter((v) => v !== null);

    if (validAtr.length > 0) {
      let mean = validAtr.reduce((sum, value) => sum + value, 0) / validAtr.length;
      let stdDev = Math.sqrt(
        validAtr.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
          validAtr.length
      );
      clusteredVolatility.push(stdDev);
    } else {
      clusteredVolatility.push(null);
    }
  }

  // Fill missing values at the beginning
  clusteredVolatility = Array(basePeriod).fill(null).concat(clusteredVolatility);

  return { atr, clusteredVolatility };
}



