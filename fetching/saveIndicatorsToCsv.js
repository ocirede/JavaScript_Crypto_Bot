import fs from "fs";
import path from "path";
import { Parser } from "@json2csv/plainjs";

export function saveIndicatorsToCsv(
  timestamps,
  close,
  bb,
  ema1,
  ema2,
  ema3,
  macd,
  trend,
  smoothedClose,
  bestFitLine,
  supportLine,
  resistLine,
  atr,
  adx,
  rsi,
  filePathIndicators,
  resetFile = false
) {

  console.log("Called Indicator csv function");
  // Ensure the directory exists
  const dir = path.dirname(filePathIndicators);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }

  // CSV headers
  const fields = [
    "timestamp",
    "close",
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
    "trend",
    "kalman",
    "slope",
    "support",
    "resistance",
    "atr",
    "adx",
    "rsi"
  
  ];

  const json2csvParser = new Parser({
    fields,
    header: !fs.existsSync(filePathIndicators) || resetFile,
  });

  // Prepare data for each timestamp
  const data = timestamps
    .map((ts, index) => {
      const timestamp = new Date(ts);
      if (isNaN(timestamp.getTime())) {
        console.error(`Invalid timestamp at index ${index}: ${ts}`);
        return null;
      }

      return {
        timestamp: timestamp.toISOString(),
        close: close?.[index] ?? null,
        bbMiddle: bb.middle?.[index] ?? null,
        bbUpper: bb.upper?.[index] ?? null,
        bbLower: bb.lower?.[index] ?? null,
        bbPb: bb.pb?.[index] ?? null,
        ema55: ema1?.[index] ?? null,
        ema400: ema2?.[index] ?? null,
        ema800: ema3?.[index] ?? null,
        macd: macd.macdLine?.[index] ?? null,
        signal: macd.signalLine?.[index] ?? null,
        histogram: macd.histogram?.[index] ?? null,
        trend: trend?.[index] ?? null,
        kalman: smoothedClose?.[index] ?? null,
        slope: bestFitLine?.[index] ?? null,
        support: supportLine?.[index] ?? null,
        resistance: resistLine?.[index] ?? null,
        atr: atr?.[index] ?? null,
        adx: adx?.[index] ?? null,
        rsi: rsi?.[index] ?? null,

      };
    })
    .filter((entry) => entry !== null);

  // Write or append data to CSV
  if (resetFile) {
    // Reset the file and write new data with the header
    const csvData = json2csvParser.parse(data);
    fs.writeFileSync(filePathIndicators, csvData + "\n", "utf8");
    console.log("File reset and written with new data.");
  } else {
    // Append data to existing file without headers
    const appendParser = new Parser({ fields, header: false });
    const csvData = appendParser.parse(data); // Parse data to CSV format

    if (!fs.existsSync(filePathIndicators)) {
      // If file doesn't exist, write header first
      fs.writeFileSync(filePathIndicators, `${fields.join(",")}\n`, "utf8");
    }

    fs.appendFileSync(filePathIndicators, csvData + "\n", "utf8");
  }
}
