import { resetTrading, recordTrade } from "./tradingState.js";
let wins = 0;
let losses = 0;
let initialBalance = 100000.0;
let moneyWon = 2500;
let moneyLoss = 1000;
let trades = 20;
let percentageWin = (wins / trades) * 100;
let percentageLoss = (losses / trades) * 100;
let currentBalance = initialBalance + moneyWon - moneyLoss;
let leverage = 100;
let tradeAmount = 50;
const isWin = wins > losses ? true : false;
export function tradingStrategy() {
  
  
  recordTrade(isWin, wins, losses)
}

export function manualResetTrading() {
  resetTrading();
  wins=0;
  losses= 0;
 }
