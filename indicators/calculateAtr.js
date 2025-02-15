import { kalmanFilter } from "./kalmanFilter.js";
function calculateATR(highs, lows, closes, period) {
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

function calculateADX(highs, lows, closes, period) {
  let plusDM = [];
  let minusDM = [];
  let tr = [];
  let smoothedPlusDM = [];
  let smoothedMinusDM = [];
  let smoothedTR = [];
  let plusDI = [];
  let minusDI = [];
  let dx = [];
  let adx = [];

  for (let i = 1; i < highs.length; i++) {
    let upMove = highs[i] - highs[i - 1];
    let downMove = lows[i - 1] - lows[i];

    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);

    let highLow = highs[i] - lows[i];
    let highClose = Math.abs(highs[i] - closes[i - 1]);
    let lowClose = Math.abs(lows[i] - closes[i - 1]);

    tr.push(Math.max(highLow, highClose, lowClose));
  }

  if (tr.length < period) {
    console.error("Not enough data to calculate ADX");
    return { adx: [] };
  }

  let sumTR = tr.slice(0, period).reduce((a, b) => a + b, 0);
  let sumPlusDM = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
  let sumMinusDM = minusDM.slice(0, period).reduce((a, b) => a + b, 0);

  smoothedTR.push(sumTR);
  smoothedPlusDM.push(sumPlusDM);
  smoothedMinusDM.push(sumMinusDM);

  for (let i = period; i < tr.length; i++) {
    let smoothedTRValue =
      smoothedTR[i - period] - smoothedTR[i - period] / period + tr[i];
    let smoothedPlusDMValue =
      smoothedPlusDM[i - period] -
      smoothedPlusDM[i - period] / period +
      plusDM[i];
    let smoothedMinusDMValue =
      smoothedMinusDM[i - period] -
      smoothedMinusDM[i - period] / period +
      minusDM[i];

    smoothedTR.push(smoothedTRValue);
    smoothedPlusDM.push(smoothedPlusDMValue);
    smoothedMinusDM.push(smoothedMinusDMValue);
  }

  for (let i = 0; i < smoothedTR.length; i++) {
    let plusDIValue = (smoothedPlusDM[i] / smoothedTR[i]) * 100;
    let minusDIValue = (smoothedMinusDM[i] / smoothedTR[i]) * 100;

    plusDI.push(plusDIValue);
    minusDI.push(minusDIValue);

    let dxValue =
      (Math.abs(plusDIValue - minusDIValue) / (plusDIValue + minusDIValue)) *
      100;
    dx.push(dxValue);
  }

  let sumDX = dx.slice(0, period).reduce((a, b) => a + b, 0) / period;
  adx.push(sumDX);

  for (let i = period; i < dx.length; i++) {
    let adxValue = (adx[i - period] * (period - 1) + dx[i]) / period;
    adx.push(adxValue);
  }

  while (adx.length < highs.length) {
    adx.unshift(null);
  }


  
  return { adx };
}

export function calculateATRWithHawkes(highs, lows, closes, basePeriod) {
  // Calculate ATR, ATR ROC, ATR Slope, and ADX
  let { atr, avgATR, smoothedAtr } = calculateATR(
    highs,
    lows,
    closes,
    basePeriod
  );
  let { adx, smoothedAdx } = calculateADX(highs, lows, closes, basePeriod);

  return { atr, avgATR, smoothedAtr, adx };
}
