import { kalmanFilter } from "./kalmanFilter.js";
export function calculateATR(highs, lows, closes, period) {
  let tr = [];
  let atr = [];
  let normATR = [];

  for (let i = 1; i < highs.length; i++) {
    let highLow = highs[i] - lows[i];
    let highClose = Math.abs(highs[i] - closes[i - 1]);
    let lowClose = Math.abs(lows[i] - closes[i - 1]);
    tr.push(Math.max(highLow, highClose, lowClose));
  }

  if (tr.length < period) {
    console.error("Not enough data to calculate ATR");
    return { atr: [], normATR: [] };
  }

  let firstATR =
    tr.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  atr.push(firstATR);

  for (let i = period; i < tr.length; i++) {
    let currentATR = (atr[atr.length - 1] * (period - 1) + tr[i]) / period;
    atr.push(currentATR);
  }

  while (atr.length < highs.length) {
    atr.unshift(null);
  }

  let avgATR = atr.reduce((sum, val) => sum + (val || 0), 0) / atr.length;
  normATR = atr.map((value) => (value !== null ? value / avgATR : null));

  const smoothedAtr = kalmanFilter(atr);

  return { atr, avgATR, smoothedAtr };
}



