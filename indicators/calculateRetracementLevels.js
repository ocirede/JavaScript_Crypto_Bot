export function calculateRetracementAndPivotPoints(
  timestamps,
  open,
  highPrices,
  lowPrices,
  closePrices
) {
  const keyLevels = [0, 23.6, 38.2, 50, 61.8, 78.6, 100];
  const clusters = [];
  // Sort timestamps and corresponding prices
  const data = timestamps.map((timestamp, index) => ({
    timestamp: new Date(timestamp),
    open: open[index],
    high: highPrices[index],
    low: lowPrices[index],
    close: closePrices[index],
  })).sort((a, b) => a.timestamp - b.timestamp);

  let currentWeekStart = null;
  let currentWeekEnd = null;

  let currentWeekHighs = [];
  let currentWeekLows = [];
  let currentWeekCloses = [];
  let currentWeekTimestamps = [];

  // Iterate through all the candles and group them by week based on timestamp
  for (let i = 0; i < data.length; i++) {
    const { timestamp, high, low, close } = data[i];

    // Determine the start and end of the week for the current timestamp
    const weekStart = getStartOfWeek(timestamp);
    const weekEnd = getEndOfWeek(weekStart);

    // Check if we are still in the same week
    if (currentWeekStart === null || weekStart.getTime() !== currentWeekStart.getTime()) {
      // Process the previous week if it exists
      if (currentWeekHighs.length > 0) {
        processWeek(
          currentWeekTimestamps,
          currentWeekHighs,
          currentWeekLows,
          currentWeekCloses,
          keyLevels,
          clusters
        );
      }

      // Reset for the new week
      currentWeekStart = weekStart;
      currentWeekEnd = weekEnd;
      currentWeekHighs = [];
      currentWeekLows = [];
      currentWeekCloses = [];
      currentWeekTimestamps = [];
    }

    // Accumulate the data for the current week
    currentWeekHighs.push(high);
    currentWeekLows.push(low);
    currentWeekCloses.push(close);
    currentWeekTimestamps.push(timestamp);
  }

  // Process the last week if there are remaining candles
  if (currentWeekHighs.length > 0) {
    processWeek(
      currentWeekTimestamps,
      currentWeekHighs,
      currentWeekLows,
      currentWeekCloses,
      keyLevels,
      clusters
    );
  }
  return clusters;
}

// Helper function to get the start of the week (Monday 00:00)
function getStartOfWeek(date) {
  const startOfWeek = new Date(date);
  const currentDayOfWeek = startOfWeek.getDay();
  const daysToSubtract = (currentDayOfWeek === 0) ? 6 : currentDayOfWeek - 1; 
  startOfWeek.setHours(0, 0, 0, 0); 
  startOfWeek.setDate(startOfWeek.getDate() - daysToSubtract); 
  return startOfWeek;
}

// Helper function to get the end of the week (Sunday 20:00)
function getEndOfWeek(startOfWeek) {
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); 
  endOfWeek.setHours(0, 0, 0, 0);
  return endOfWeek;
}

function processWeek(timestamps, highs, lows, closes, keyLevels, clusters) {
  const clusterHigh = Math.max(...highs);
  const clusterLow = Math.min(...lows);
  const clusterClose = closes[0];
  const range = clusterHigh - clusterLow;

  // Calculate Retracement Levels
  const retracementLevels = keyLevels.reduce((acc, level) => {
    const retracementPrice = clusterHigh - range * (level / 100);
    acc[`${level}%`] = parseFloat(retracementPrice.toFixed(2));
    return acc;
  }, {});

  // Calculate Fibonacci Pivot Points
  const pivotPoint = (clusterHigh + clusterLow + clusterClose) / 3;
  const resistance1 = pivotPoint + 0.382 * range;
  const resistance2 = pivotPoint + 0.618 * range;
  const resistance3 = pivotPoint + range;
  const support1 = pivotPoint - 0.382 * range;
  const support2 = pivotPoint - 0.618 * range;
  const support3 = pivotPoint - range;

  clusters.push({
    clusterHigh: parseFloat(clusterHigh.toFixed(2)),
    clusterLow: parseFloat(clusterLow.toFixed(2)),
    clusterClose: parseFloat(clusterClose.toFixed(2)),
    retracementLevels,
    pivotPoints: {
      pivotPoint: parseFloat(pivotPoint.toFixed(2)),
      resistance1: parseFloat(resistance1.toFixed(2)),
      resistance2: parseFloat(resistance2.toFixed(2)),
      resistance3: parseFloat(resistance3.toFixed(2)),
      support1: parseFloat(support1.toFixed(2)),
      support2: parseFloat(support2.toFixed(2)),
      support3: parseFloat(support3.toFixed(2)),
    },
    timestamps: timestamps, 
  });
}
