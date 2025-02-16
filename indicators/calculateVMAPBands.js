import { calculateStandardDeviation } from "./calculateStandardDeviation.js";


// VWAP bands calculation
export function calculateVWAPBands(prices, period, sma) {
    const {strDev} = calculateStandardDeviation(prices, period, sma);
    const bandMultiplier1 = 1;
    const bandMultiplier2 = 2;
  
    const middleBand = prices.map((vwap) => vwap);
    const upperBand1 = prices.map((vwap) => vwap + strDev * bandMultiplier1);
    const lowerBand1 = prices.map((vwap) => vwap - strDev * bandMultiplier1);
    const upperBand2 = prices.map((vwap) => vwap + strDev * bandMultiplier2);
    const lowerBand2 = prices.map((vwap) => vwap - strDev * bandMultiplier2);
  
    return { middleBand, upperBand1, lowerBand1, upperBand2, lowerBand2 };
  }