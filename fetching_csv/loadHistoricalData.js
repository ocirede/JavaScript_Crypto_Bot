import fs from "fs";
import csv from "csv-parser";

export function loadHistoricalData(filePath, filePath4h) {
  return new Promise((resolve, reject) => {
    // Load the file content
    const loadFile = (filePath) => {
      return new Promise((resolve, reject) => {
        const data = [];
        console.log("Loading historical data from:", filePath);

        if (!fs.existsSync(filePath)) {
          console.error(`File not found: ${filePath}`);
          return reject(new Error(`File not found: ${filePath}`));
        }

        fs.createReadStream(filePath, { encoding: "utf8" })
          .pipe(csv())
          .on("headers", (headers) => {
            const expectedHeaders = ["timestamp", "open", "high", "low", "close", "volume"];
            const isHeaderValid = expectedHeaders.every((header) => headers.includes(header));

            if (!isHeaderValid) {
              console.error("Invalid headers in CSV file:", headers);
              this.destroy(); // Stop reading further
              return reject(new Error(`CSV file has invalid headers: ${headers.join(", ")}`));
            }
          })
          .on("data", (row) => {
            try {
              // Validate and parse row
              if (
                !row.timestamp ||
                !row.open ||
                !row.high ||
                !row.low ||
                !row.close ||
                !row.volume
              ) {
                console.error("Invalid row format, skipping:", row);
                return;
              }

              const cleanedTimestamp = row.timestamp.replace(/"+/g, "").trim();
              const date = new Date(cleanedTimestamp);

              if (isNaN(date.getTime())) {
                console.error(`Invalid timestamp, skipping row: ${cleanedTimestamp}`);
                return;
              }

              const open = parseFloat(row.open);
              const high = parseFloat(row.high);
              const low = parseFloat(row.low);
              const close = parseFloat(row.close);
              const volume = parseFloat(row.volume);

              if ([open, high, low, close, volume].some(isNaN)) {
                console.error("Invalid numerical values in row, skipping:", row);
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
            if (data.length === 0) {
              console.error("No valid historical data loaded.");
              return reject(new Error("No valid historical data loaded."));
            }

            
            console.log(`Successfully loaded ${data.length} rows from ${filePath}.`);
            resolve(data);

          })
          .on("error", (error) => {
            console.error("Error reading file:", error);
            reject(error);
          });
      });
    };

    // Use Promise.all to load both files in parallel
    Promise.all([loadFile(filePath), loadFile(filePath4h)])
      .then(([data, data4h]) => {
        // Both files are loaded successfully
        resolve({ data, data4h });
      })
      .catch((error) => {
        // Handle any error that occurred during loading
        reject(error);
      });
  });
}
