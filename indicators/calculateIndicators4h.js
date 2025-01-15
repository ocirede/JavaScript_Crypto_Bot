import { calculateRetracementAndPivotPoints } from "./calculateRetracementLevels.js";

export function calculate4hIndicators({ arrayOfArrays }) {
  const timestamps = arrayOfArrays.map((candle) => parseFloat(candle[0]));
  const open = arrayOfArrays.map((candle) => parseFloat(candle[1]));
  const high = arrayOfArrays.map((candle) => parseFloat(candle[2]));
  const low = arrayOfArrays.map((candle) => parseFloat(candle[3]));
  const close = arrayOfArrays.map((candle) => parseFloat(candle[4]));
  const volume = arrayOfArrays.map((candle) => parseFloat(candle[5]));

  // Compute Fibonacci retracement levels for the session
  const fibPivotsRetracement = calculateRetracementAndPivotPoints(
    timestamps,
    open,
    high,
    low,
    close
  );

  return fibPivotsRetracement;
}
