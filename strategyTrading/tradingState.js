let isTradingActive = true; 

export function stopTrading() {
  isTradingActive = false;
  console.log("Trading has been stopped.");
}

export function resetTrading() {
  isTradingActive = true;
  console.log("Trading has been resumed.");
}

export function isTrading() {
  return isTradingActive;
}