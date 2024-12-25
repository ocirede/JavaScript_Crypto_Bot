import { calculateRetracementAndPivotPoints } from "./calculateRetracementLevels.js";

export function calculate4hIndicators({ reversedArray }) {
  const timestamps = reversedArray.map((candle) => parseFloat(candle[0]));
  const open = reversedArray.map((candle) => parseFloat(candle[1]));
  const high = reversedArray.map((candle) => parseFloat(candle[2]));
  const low = reversedArray.map((candle) => parseFloat(candle[3]));
  const close = reversedArray.map((candle) => parseFloat(candle[4]));
  const volume = reversedArray.map((candle) => parseFloat(candle[5]));

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
