import ccxt from "ccxt";
import "dotenv/config";
import {
  resetTrading,
  recordTrade,
} from "../strategy_evaluation_trading/tradingState.js";
import { lastPrice } from "../webSocket/webSocket.js";

const symbol = "BTC-USDT";
let wins = 0;
let losses = 0;
let isWin = false;

const exchange = new ccxt.bingx({
  apiKey: process.env.TEST_API_KEY,
  secret: process.env.SECRET_TEST_API_KEY,
  timeout: 20000,
  enableRateLimit: true,
});

export async function fetchTradingInfo() {
  try {
    const balance = await exchange.fetchBalance();

    // Convert balance data into a structured array
    const formattedBalances = Object.keys(balance.total).map((asset) => ({
      asset,
      free: balance.free[asset] || 0,
      used: balance.used[asset] || 0,
      total: balance.total[asset] || 0,
    }));

    return { formattedBalances };
  } catch (error) {
    console.error("Error fetching trading info:", error);
    throw new Error("Failed to fetch trading info");
  }
}

export async function fetchTradesHistory() {
  try {
    const tradesHistory = await exchange.fetchMyTrades(symbol);
    if (!lastPrice) {
      throw new Error("Unable to fetch current price for symbol");
    }

    // Evaluate trades for win/loss
    tradesHistory.forEach((trade) => {
      if (trade.side === "buy" && trade.price < lastPrice) {
        losses++;
        isWin = false;
      } else if (trade.side === "buy" && trade.price > lastPrice) {
        wins++;
        isWin = true;
      } else if (trade.side === "sell" && trade.price > lastPrice) {
        wins++;
        isWin = true;
      } else if (trade.side === "sell" && trade.price < lastPrice) {
        isWin = false;
      }
      recordTrade(isWin, wins, losses);
    });
    return { tradesHistory, wins, losses };
  } catch (error) {
    console.error("Error fetching trades history:", error);
    throw new Error("Failed to fetch trades history");
  }
}

export async function fetchOpenTrades() {
  try {
    if (exchange.has["fetchOpenOrders"]) {
      const openOrders = await exchange.fetchOpenOrders();
      return openOrders;
    }
  } catch (error) {
    console.error("Error fetching open orders:", error);
    throw new Error("Failed to fetch  open orders");
  }
}

export function manualResetTrading() {
  resetTrading();
  wins = 0;
  losses = 0;
}
