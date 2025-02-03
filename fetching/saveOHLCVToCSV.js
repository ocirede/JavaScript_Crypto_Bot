import fs from "fs";
import path from "path";
import { Parser } from "@json2csv/plainjs";

export function saveOHLCVToCSV(ohlcv, filePath, resetFile = false) {
  console.log("saveOHLCVToCSV function has been called");

  // Ensure the directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }

  const fields = ["timestamp", "open", "high", "low", "close", "volume"];
  const json2csvParser = new Parser({ fields, header: true });

  // Convert OHLCV data to an array of objects
  const ohlcvObjects = ohlcv
    .map((candle, index) => {
      const timestamp = new Date(candle[0]);
      if (isNaN(timestamp.getTime())) {
        console.error(`Invalid timestamp at index ${index}: ${candle[0]}`);
        return null;
      }

      return {
        timestamp: timestamp.toISOString(),
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5],
      };
    })
    .filter((candle) => candle !== null);

  if (ohlcvObjects.length === 0) {
    console.log("No valid OHLCV data to save.");
    return;
  }

  // Reset file if specified
  if (resetFile && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Deleted existing file: ${filePath}`);
  }

  // Write the data to the file
  const csvData = json2csvParser.parse(ohlcvObjects);
  fs.writeFileSync(filePath, csvData, "utf8");
  console.log(`Saved ${ohlcvObjects.length} rows to ${filePath}`);
}
