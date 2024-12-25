import { stopTrading, resetTrading } from "./tradingState.js";
let wins = 3;
let losses = 6;
export function tradingStrategy(data, data4h) {
  const {
    last,
    ema21,
    ema50,
    ema200,
    latestBB,
    bidAskSpread,
    sessionProfiles,
    trends,
  } = data;

  let initialBalance = 100000.0;
  let moneyWon = 2500;
  let moneyLoss = 1000;
  let trades = 20;
  const lossThreshold = 2;
  let percentageWin = (wins / trades) * 100;
  let percentageLoss = (losses / trades) * 100;
  let currentBalance = initialBalance + moneyWon - moneyLoss;
  let leverage = 100;
  let tradeAmount = 50;
  const takeProfit = "";
  const stopLoss = "";
  const long = "";
  const short = "";
  const stats = [
    { Metric: "Real Time Price", Value: last },
    { Metric: "Initial Balance", Value: `${initialBalance} VST` },
    { Metric: "Percentage Wins", Value: `${percentageWin.toFixed(2)}%` },
    { Metric: "Percentage Losses", Value: `${percentageLoss.toFixed(2)}%` },
    { Metric: "Current Balance", Value: `${currentBalance.toFixed(2)} VST` },
  ];
  console.table(stats);

  // trends.forEach((trend, index) => {
  //   console.log(`Trend ${index + 1}: ${trend.trend}`);
  //   console.log(
  //     "Past Sessions Levels:",
  //     trend.pastSessionsLevels.map((level) => ({
  //       poc: level.poc,
  //       val: level.val,
  //       vah: level.vah,
  //     }))
  //   );
  // });

  // console.log(data4h)
  console.log("\n==================== End of Stats ====================\n");

  console.log("\n==================== Trading strategy ====================\n");

  function recordTrade(isWin) {
    if (isWin) {
      wins++;
    } else {
      losses++;
    }

    checkingTradingStatus();
  }

  function checkingTradingStatus() {
    if (losses > wins * lossThreshold) {
      stopTrading();
    }
  }

  recordTrade(true);

  console.log("\n==================== Monitoring ====================\n");
}

export function manualResetTrading() {
  resetTrading();
  wins = 0;
  losses = 0;
}
