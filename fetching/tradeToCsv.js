import fs from "fs";

const csvPath = "trades.csv";

// Ensure file exists with headers
if (!fs.existsSync(csvPath)) {
  fs.writeFileSync(csvPath, "action,type,price,direction,timeframe,timestamp\n");
}

export function saveTradeToCSV(trade) {
  const line = `${trade.action},${trade.type},${trade.price},${trade.direction},${trade.timeframe},${new Date().toISOString()}\n`;
  fs.appendFileSync(csvPath, line);
  console.log(`Trade saved to CSV: ${line}`);
}
