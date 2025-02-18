import { init } from "./webSocket/webSocket.js";
import express from "express";
import cors from "cors";
import path from "path";
import "dotenv/config";
import { manualResetTrading } from "./fetching/fetchingPrivateApi.js";
import { fetchDataForStrategy } from "./fetching/fetchData.js";
import {
  fetchTradingInfo,
  fetchTradesHistory,
  fetchOpenTrades
} from "./fetching/fetchingPrivateApi.js";

async function main() {
  console.log("Starting trading bot...");
  const port = process.env.PORT;
  try {
    const app = express();

    // Use process.cwd() to get the current working directory
    const __dirname = process.cwd();

    app.use(cors());
    app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "index.html"));
    });
    // Serve panel.html when visiting /panel
    app.get("/panel", (req, res) => {
      res.sendFile(path.join(__dirname, "control_panel", "panel.html"));
    });

    app.get("/ohlcv_BTC-USDT_:timeframe.csv", (req, res) => {
      const { timeframe } = req.params;
      if (!timeframe.match(/^\d+[mh]$/)) {
        return res.status(400).send("Invalid timeframe format.");
      }
      const filePath = path.join(__dirname, `ohlcv_BTC-USDT_${timeframe}.csv`);
      console.log(`Attempting to send file from: ${filePath}`);
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error(`Error sending file: ${filePath}`, err);
          res.status(404).send("File not found.");
        }
      });
    });

    app.get("/indicators_BTC-USDT_:timeframe.csv", (req, res) => {
      const { timeframe } = req.params;

      if (!timeframe.match(/^\d+[mh]$/)) {
        return res.status(400).send("Invalid timeframe format.");
      }
      const filePath = path.join(
        __dirname,
        `indicators_BTC-USDT_${timeframe}.csv`
      );
      console.log(`Attempting to send file from: ${filePath}`);
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error(`Error sending file: ${filePath}`, err);
          res.status(404).send("File not found.");
        }
      });
    });

    app.get("/priceAnalysis:timeframe.csv", (req, res) => {
      const { timeframe } = req.params;

      if (!timeframe.match(/^\d+[mh]$/)) {
        return res.status(400).send("Invalid timeframe format.");
      }
      const filePath = path.join(
        __dirname,
        `priceAnalysis${timeframe}.csv`
      );
      console.log(`Attempting to send file from: ${filePath}`);
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error(`Error sending file: ${filePath}`, err);
          res.status(404).send("File not found.");
        }
      });
    });

    //Endpoint to get trading info
    app.get("/trading-info", async (req, res) => {
      try {
        const tradingInfo = await fetchTradingInfo();
        res.json(tradingInfo);
      } catch (error) {
        console.error("Error fetching trading info:", error);
        res.status(500).json({ error: "Failed to fetch trading info" });
      }
    });

    // Endpoint to get trades history
    app.get("/trades-history", async (req, res) => {
      try {
        // Fetch trades history
        const {tradesHistory, wins, losses} = await fetchTradesHistory();
        // Send the trades history back as JSON
        res.json({
          tradesHistory,
          stats: {
            wins,
            losses,
            winRatio : losses === 0 ? (wins === 0 ? "N/A" : "Infinity") : (wins / (wins + losses)).toFixed(2),
            lossRatio : wins === 0 ? "0" : (losses / (wins + losses)).toFixed(2)
        },
        });
        
            } catch (error) {
        console.error("Error fetching trades history:", error);
        res.status(500).json({ error: "Failed to fetch trades history" });
      }
    });

     // Endpoint to get open orders
     app.get("/open-orders", async (req, res) => {
      try {
        // Fetch trades history
        const openOrders = await fetchOpenTrades();
        // Send the trades history back as JSON
        res.json(openOrders);
      } catch (error) {
        console.error("Error fetching trades history:", error);
        res.status(500).json({ error: "Failed to fetch trades history" });
      }
    });

    // Endpoint to reset trading
    app.post("/reset-trading", (req, res) => {
      try {
        manualResetTrading();
        res.status(200).send({ message: "Trading reset successfully!" });
      } catch (error) {
        console.error("Error resetting trading:", error);
        res.status(500).send({ message: "Error resetting trading.", error });
      }
    });

    // Serve static files
    app.use(express.static(path.join(__dirname, "..")));
    app.use("/chart", express.static(path.join(__dirname, "chart")));
    app.use(
      "/control_panel",
      express.static(path.join(__dirname, "control_panel"))
    );

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
    });

    await fetchDataForStrategy();
    init();
  } catch (error) {
    console.error("Error in main function:", error);
  }
}

main();
