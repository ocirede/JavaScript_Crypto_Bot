import { calculateStandardDeviation } from "./calculateStandardDeviation.js";


// VWAP bands calculation
export function calculateVWAPBands(vwapValues) {
    const {strDev} = calculateStandardDeviation(vwapValues);
    const bandMultiplier1 = 1;
    const bandMultiplier2 = 2;
  
    const middleBand = vwapValues.map((vwap) => vwap);
    const upperBand1 = vwapValues.map((vwap) => vwap + strDev * bandMultiplier1);
    const lowerBand1 = vwapValues.map((vwap) => vwap - strDev * bandMultiplier1);
    const upperBand2 = vwapValues.map((vwap) => vwap + strDev * bandMultiplier2);
    const lowerBand2 = vwapValues.map((vwap) => vwap - strDev * bandMultiplier2);
  
    return { middleBand, upperBand1, lowerBand1, upperBand2, lowerBand2 };
  }