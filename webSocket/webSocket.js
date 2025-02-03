import WebSocket, { WebSocketServer } from "ws";
import zlib from "zlib";
import "dotenv/config";
import { webSocketOrderBookFetch } from "../fetching/fetchData.js";
import { Buffer } from "buffer";
import chalk from "chalk";

const symbol = "BTC-USDT";
const wspath = "wss://open-api-swap.bingx.com/swap-market";
const wsport = process.env.WS_PORT;
let socket;
let receivedMessage = "";
let realTimePrice = 0;
let lastMessageTime = 0;
const RATE_LIMIT = 1000;
let lastFetchTime = 0;
const fetchInterval = 3000;

// Step 1: Create a WebSocket server for browser communication
const browserWSS = new WebSocketServer({ port: wsport });
const browserClients = new Set();

let latestData = null;
const broadcastInterval = 1000;

// Step 2: Handle browser WebSocket connections
browserWSS.on("connection", (ws) => {
  console.log("Browser connected to WebSocket server");
  browserClients.add(ws);

  ws.on("close", () => {
    console.log("Browser disconnected");
    browserClients.delete(ws);
  });

  ws.on("error", (err) => console.error("Browser WebSocket error:", err));
});

// Step 3: Throttle message broadcasting
function broadcastThrottledData() {
  if (latestData) {
    // Send the latest data to all connected clients
    for (const client of browserClients) {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify(latestData));
      }
    }
    latestData = null;
  }
}

// Step 4: Start broadcasting at intervals (every 1 second in this case)
setInterval(broadcastThrottledData, broadcastInterval);

// Step 5: Function to handle incoming data updates (real data should call this)
function onNewDataUpdate(data) {
  latestData = data; // Store only the latest data
}

export function init() {
  socket = new WebSocket(wspath);
  socket.on("open", onOpen);
  socket.on("message", onMessage);
  socket.on("error", onError);
  socket.on("close", onClose);
}

const CHANNEL = {
  id: "e745cd6d-d0f6-4a70-8d5a-043e4c741b40",
  reqType: "sub",
  dataType: `${symbol}@depth5@500ms`,
};

function onOpen() {
  console.log("WebSocket connected");
  socket.send(JSON.stringify(CHANNEL));
}

function onError(error) {
  console.log("WebSocket error:", error);
}

async function onMessage(message) {
  const buf = Buffer.from(message);
  const decodedMsg = zlib.gunzipSync(buf).toString("utf-8");

  // Handle "Ping" message
  if (decodedMsg === "Ping") {
    socket.send("Pong");
    console.log("Pong");
    return;
  }

  // Fetch orderbook and spread data
  const { orderbook, bidAskSpread, realTimePrice } =
    await webSocketOrderBookFetch();
  const lastPrice = realTimePrice.last;
  // Prepare real-time price data to send to the clients
  const realTimeData = {
    price: lastPrice,
    timestamp: new Date().toISOString(),
  };
  console.log("LastPrice:", lastPrice)
  // Update the latest data
  onNewDataUpdate(realTimeData);

  // Throttle market data fetches to avoid too frequent calls
  const currentTime = Date.now();

  // Fetch data based on the fetch interval
  if (currentTime - lastFetchTime >= fetchInterval) {
    try {
      // Update the last fetch time
      lastFetchTime = currentTime;
    } catch (error) {
      console.error("Error fetching order book or price:", error);
    }
  } else {
    console.log("Skipping market data fetch to respect fetch interval");
  }

  // Handle rate limit based on WebSocket message timing
  if (currentTime - lastMessageTime >= RATE_LIMIT) {
    // Process WebSocket message only if rate limit allows
    lastMessageTime = currentTime;
  } else {
    console.log("Skipping WebSocket message processing to respect rate limit");
  }
}

function onClose() {
  console.log("WebSocket closed");
  setTimeout(() => {
    console.log("Attempting to reconnect...");
    init();
  }, 1000);
}

export { socket, realTimePrice };
