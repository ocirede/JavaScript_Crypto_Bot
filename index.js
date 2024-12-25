import { fetchDataForStrategy } from "./fetching_csv/fetchData.js";
import { init } from "./servers/webSocket.js";
import express from "express";
import cors from "cors";
import path from "path";
import "dotenv/config";
import { manualResetTrading } from "./strategyTrading/strategy.js";

async function main() {
  console.log("Starting trading bot...");
  const port = process.env.PORT;
  try {
    const app = express();

    // Use process.cwd() to get the current working directory
    const __dirname = process.cwd();

    // Serve static files
    app.use(express.static(path.join(__dirname, "..")));
    app.use("/chart", express.static(path.join(__dirname, "chart")));

    app.use(cors());
    app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "index.html"));
    });
    // Serve the CSV file
    app.get("/ohlcv_BTC-USDT_30m.csv", (req, res) => {
      res.sendFile(path.join(__dirname, "ohlcv_BTC-USDT_30m.csv"));
    });

    // Serve the Indicators CSV file
    app.get("/indicators_BTC-USDT_30m.csv", (req, res) => {
      res.sendFile(path.join(__dirname, "indicators_BTC-USDT_30m.csv"));
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
