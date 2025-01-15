// Import your EMA and Bollinger Bands functions
import { calculateEMA } from "./emaCalculation.js";
import { calculateBollingerBands } from "./bollingerBandsCalculation.js";

// Inputs for the indicator
const sensitivity3 = 100; 
const fastLength3 = 400; 
const slowLength3 = 800; 
const channelLength3 = 20; 
const mult3 = 2.5; 

const sensitivity4 = 100; 
const fastLength4 = 400; 
const slowLength4 = 800; 
const channelLength4 = 20; 
const mult4 = 2.5;


// MACD Calculation
function calc_macd(close, fastLength, slowLength) {
    const fastMA = calculateEMA(close, fastLength);
    const slowMA = calculateEMA(close, slowLength);
    const macd = fastMA[fastMA.length - 1] - slowMA[slowMA.length - 1]; // Latest MACD value
    return macd;
}

// Bollinger Bands Calculation (uses your imported function)
function calc_BBUpper(source, length, mult) {
    const { upper } = calculateBollingerBands(source, length, mult);
    return upper[upper.length - 1];  
}

function calc_BBLower(source, length, mult) {
    const { lower } = calculateBollingerBands(source, length, mult);
    return lower[lower.length - 1]; 
}

// Logic for third instance
export function calculateThirdInstance(close) {
  // Calculate the MACD difference (change)
  const t3 = (calc_macd(close, fastLength3, slowLength3) - calc_macd(close.slice(1), fastLength3, slowLength3)) * sensitivity3;

  // Calculate Bollinger Bands upper and lower
  const e3 = calc_BBUpper(close, channelLength3, mult3) - calc_BBLower(close, channelLength3, mult3);

  // Define trend directions based on t3 value
  const trendUp3 = (t3 >= 0) ? t3 : 0;
  const trendDown3 = (t3 < 0) ? (-1 * t3) : 0;

  return { trendUp3, trendDown3, e3 };
}

// Logic for fourth instance
export function calculateFourthInstance(close) {
  // Calculate the MACD difference (change)
  const t4 = (calc_macd(close, fastLength4, slowLength4) - calc_macd(close.slice(1), fastLength4, slowLength4)) * sensitivity4;

  // Calculate Bollinger Bands upper and lower
  const e4 = calc_BBUpper(close, channelLength4, mult4) - calc_BBLower(close, channelLength4, mult4);

  // Define trend directions based on t4 value
  const trendUp4 = (t4 >= 0) ? t4 : 0;
  const trendDown4 = (t4 < 0) ? (-1 * t4) : 0;

  return { trendUp4, trendDown4, e4 };
}


export function calculateMACD(close) {
  const macdFastLength = 5;
  const macdSlowLength = 400;
  const macdSignalLength = 50;
  // Calculate the MACD line (fast EMA - slow EMA)
  const fastEMA = calculateEMA(close, macdFastLength);
  const slowEMA = calculateEMA(close, macdSlowLength);
  
  // Ensure the arrays are aligned to avoid index errors
  const macdLine = fastEMA.map((value, index) => value - slowEMA[index]);
  // Calculate the Signal line (EMA of the MACD line)
  const signalLine = calculateEMA(macdLine, macdSignalLength);
  // Calculate the Histogram (MACD line - Signal line)
  const histogram = macdLine.map((value, index) => value - signalLine[index]);

  return { macdLine, signalLine, histogram };
}


