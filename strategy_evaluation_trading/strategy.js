import { stopTrading, resetTrading } from "./tradingState.js";
import { realTimePrice } from "../WebSocket/webSocket.js";

let wins = 3;
let losses = 6;
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
const last = realTimePrice;

export function tradingStrategy() {
  const stats = [
    { Metric: "Real Time Price", Value: last },
    { Metric: "Initial Balance", Value: `${initialBalance} VST` },
    { Metric: "Percentage Wins", Value: `${percentageWin.toFixed(2)}%` },
    { Metric: "Percentage Losses", Value: `${percentageLoss.toFixed(2)}%` },
    { Metric: "Current Balance", Value: `${currentBalance.toFixed(2)} VST` },
  ];
  console.table(stats);
  
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


  console.log("\n==================== Monitoring ====================\n");
}

export function manualResetTrading() {
  resetTrading();
  wins = 0;
  losses = 0;
}
