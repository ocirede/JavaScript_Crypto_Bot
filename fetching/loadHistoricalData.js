import fs from "fs";
import csv from "csv-parser";

export function loadHistoricalData(filePath, filePath4h, filePath5m) {
  const loadFile = (filePath) => {
    return new Promise((resolve, reject) => {
      const data = [];
      console.log("Loading historical data from:", filePath);

      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return resolve([]); // Return empty array instead of rejecting
      }

      fs.createReadStream(filePath, { encoding: "utf8" })
        .pipe(csv())
        .on("headers", (headers) => {
          const expectedHeaders = [
            "timestamp",
            "open",
            "high",
            "low",
            "close",
            "volume",
          ];
          if (!expectedHeaders.every((header) => headers.includes(header))) {
            console.error("Invalid headers in CSV file:", headers);
            this.destroy(); // Stop reading further
            return reject(new Error(`Invalid headers in ${filePath}`));
          }
        })
        .on("data", (row) => {
          try {
            const cleanedTimestamp = row.timestamp?.replace(/"+/g, "").trim();
            const date = new Date(cleanedTimestamp);
            const open = parseFloat(row.open);
            const high = parseFloat(row.high);
            const low = parseFloat(row.low);
            const close = parseFloat(row.close);
            const volume = parseFloat(row.volume);

            if (
              isNaN(date.getTime()) ||
              [open, high, low, close, volume].some(isNaN)
            ) {
              console.error("Invalid row format, skipping:", row);
              return;
            }

            data.push({
              timestamp: date.getTime(),
              open,
              high,
              low,
              close,
              volume,
            });
          } catch (error) {
            console.error("Error parsing row:", error);
          }
        })
        .on("end", () => {
          console.log(`Loaded ${data.length} rows from ${filePath}`);
          resolve(data);
        })
        .on("error", (error) => {
          console.error("Error reading file:", filePath, error);
          reject(error);
        });
    });
  };

  // Load all files in parallel and return the aggregated result
  return Promise.all([loadFile(filePath), loadFile(filePath4h), loadFile(filePath5m)])
    .then(([data, data4h, data5m]) => ({ data, data4h, data5m }))
    .catch((error) => {
      console.error("Error loading historical data:", error);
      throw error;
    });
}
