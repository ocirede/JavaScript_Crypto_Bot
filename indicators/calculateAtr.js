import { hawkesProcess } from "./hawkesProcess.js";

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

  return { atr, avgATR };
}

function calculateATRMetrics(atr, smaPeriod = 20) {
  let atrROC = [null];
  let atrSlope = [null];
  let smoothedATRSlope = [null]; // To store the smoothed slope

  // Helper function for SMA smoothing
  function sma(data, period) {
    let smaValues = [];
    for (let i = 0; i < data.length; i++) {
      if (i >= period - 1) {
        const average = data.slice(i - period + 1, i + 1).reduce((sum, val) => sum + val, 0) / period;
        smaValues.push(average);
      } else {
        smaValues.push(null); // No SMA for initial periods
      }
    }
    return smaValues;
  }

  // Calculate ROC and Slope
  for (let i = 1; i < atr.length; i++) {
    if (atr[i] !== null && atr[i - 1] !== null) {
      atrROC.push((atr[i] - atr[i - 1]) / atr[i - 1]);
      atrSlope.push(atr[i] - atr[i - 1]);
    } else {
      atrROC.push(null);
      atrSlope.push(null);
    }
  }

  // Smooth the atrSlope using SMA
  smoothedATRSlope = sma(atrSlope, smaPeriod);

  return {  smoothedATRSlope };
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

export function calculateATRWithHawkes(
  highs,
  lows,
  closes,
  arrayOfArrays,
  basePeriod
) {
  // Extract timestamps from arrayOfArrays
  const timestamps = arrayOfArrays.map((candle) => candle[0]);

  // Calculate time differences between consecutive timestamps
  const timeDifferences = [];
  for (let i = 1; i < timestamps.length; i++) {
    timeDifferences.push(timestamps[i] - timestamps[i - 1]);
  }

  let events = highs
    .map((h, i) => {
      // Check if the high minus low is greater than 5% of the close price
      if (h - lows[i] > closes[i] * 0.05) {
        // Ensure timeDiff is valid (positive and non-zero)
        const validTimeDiff =
          timeDifferences[i - 1] && timeDifferences[i - 1] > 0
            ? timeDifferences[i - 1]
            : 1;
        return { timestamp: timestamps[i], timeDiff: validTimeDiff };
      }
      return null;
    })
    .filter((e) => e); // Filter out null values

  // Now pass these events to the Hawkes process (ensure it handles the timeDiffs)
  let hawkesIntensity = hawkesProcess(events);

  // Calculate average intensity
  let avgIntensity = hawkesIntensity.length
    ? hawkesIntensity.reduce((a, b) => a + b, 0) / hawkesIntensity.length
    : 1;

  // Calculate dynamic period based on intensity
  let dynamicPeriod = Math.max(
    20,
    Math.min(basePeriod, Math.floor(basePeriod / avgIntensity))
  );

  // Calculate ATR, ATR ROC, ATR Slope, and ADX
  let { atr, avgATR } = calculateATR(highs, lows, closes, dynamicPeriod);
  let { smoothedATRSlope } = calculateATRMetrics(atr);
  let { adx } = calculateADX(highs, lows, closes, basePeriod);

  return { atr, avgATR, smoothedATRSlope, adx };
}
