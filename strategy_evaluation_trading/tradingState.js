let isTradingActive = true; 


function stopTrading() {
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

export function recordTrade(isWin, wins, losses) {
  if (isWin) {
    wins++;
  } else {
    losses++;
  }

  checkingTradingStatus(wins, losses);
}

function checkingTradingStatus(wins, losses) {
  let lossThreshold = 2;
  if (losses > wins * lossThreshold) {
    stopTrading();
  }
}

