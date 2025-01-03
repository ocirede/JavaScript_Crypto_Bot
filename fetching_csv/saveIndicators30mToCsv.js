import fs from "fs";
import path from "path";
import { Parser } from "@json2csv/plainjs";

export function saveIndicators30mToCsv(
  timestamps,
  bb,
  ema1,
  ema2,
  ema3,
  macd,
  spikes,
  filePathIndicators30m,
  resetFile = false
) {
  console.log("Called Indicator csv function")
  // Ensure the directory exists
  const dir = path.dirname(filePathIndicators30m);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }

  // CSV headers
  const fields = [
    "timestamp",
    "bbMiddle",
    "bbUpper",
    "bbLower",
    "bbPb",
    "ema55",
    "ema400",
    "ema800",
    "macd",
    "signal",
    "histogram",
    "spikes",
  ];

  const json2csvParser = new Parser({
    fields,
    header: !fs.existsSync(filePathIndicators30m) || resetFile,
  });

  // Prepare data for each timestamp
  const data = timestamps
    .map((ts, index) => {
      const timestamp = new Date(ts);
      if (isNaN(timestamp.getTime())) {
        console.error(`Invalid timestamp at index ${index}: ${ts}`);
        return null; // Skip invalid entries
      }

      // Convert spikes array to a map for efficient lookup by timestamp
      const spikesMap = new Map(
        spikes.map((spike) => [
          new Date(spike.timestamp).toISOString(),
          spike.trValue,
        ])
      );
      // Match the spike by timestamp
      const spikeValue = spikesMap.get(timestamp.toISOString()) ?? null;
      
      return {
        timestamp: timestamp.toISOString(),
        bbMiddle: bb.middle?.[index] ?? null,
        bbUpper: bb.upper?.[index] ?? null,
        bbLower: bb.lower?.[index] ?? null,
        bbPb: bb.pb?.[index] ?? null,
        ema55: ema1?.[index] ?? null,
        ema400: ema2?.[index] ?? null,
        ema800: ema3?.[index] ?? null,
        macd: macd.MACD?.[index] ?? null,
        signal: macd.signal?.[index] ?? null,
        histogram: macd.histogram?.[index] ?? null,
        spikes: spikeValue,
      };
    })
    .filter((entry) => entry !== null); 

  // Write or append data to CSV
  if (resetFile) {
    // Reset the file and write new data with the header
    const csvData = json2csvParser.parse(data);
    fs.writeFileSync(filePathIndicators30m, csvData + "\n", "utf8");
    console.log("File reset and written with new data.");
  } else {
    // Append data to existing file without headers
    const appendParser = new Parser({ fields, header: false });
    const csvData = appendParser.parse(data); // Parse data to CSV format

    if (!fs.existsSync(filePathIndicators30m)) {
      // If file doesn't exist, write header first
      fs.writeFileSync(filePathIndicators30m, `${fields.join(",")}\n`, "utf8");
    }

    fs.appendFileSync(filePathIndicators30m, csvData + "\n", "utf8");
  }
}
