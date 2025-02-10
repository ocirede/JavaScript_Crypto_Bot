function hawkesProcess(data, kappa) {
  if (kappa <= 0.0) throw new Error("Kappa must be greater than zero.");

  const alpha = Math.exp(-kappa);
  let output = new Array(data.length).fill(NaN);

  for (let i = 1; i < data.length; i++) {
    if (isNaN(output[i - 1])) {
      output[i] = data[i];
    } else {
      output[i] = output[i - 1] * alpha + data[i];
    }
  }
  return output.map((v) => v * kappa);
}

function volSignal(close, volHawkes, lookback = 336) {
  close.length = volHawkes.length
  if (close.length !== volHawkes.length) {
    console.log("Arrays have not the same length");
  }
  let signal = new Array(close.length).fill(0);
  let q05 = rollingQuantile(volHawkes, lookback, 0.05);
  let q95 = rollingQuantile(volHawkes, lookback, 0.95);
  let lastBelow = -1;
  let currSig = 0;

  for (let i = 0; i < signal.length; i++) {
    if (volHawkes[i] < q05[i]) {
      lastBelow = i;
      currSig = 0;
    }
    if (
      volHawkes[i] > q95[i] &&
      volHawkes[i - 1] <= q95[i - 1] &&
      lastBelow > 0
    ) {
      let change = close[i] - close[lastBelow];
      currSig = change > 0 ? 1 : -1;
    }
    signal[i] = currSig;
  }
  return signal;
}

function formatDateToUTC(date) {
  return new Date(date).toISOString(); // Ensure the date is in UTC format
}

function getTradesFromSignal(data, signal) {
  let longTrades = [];
  let shortTrades = [];
  let lastSig = 0;
  let openTrade = null;

  for (let i = 0; i < data.length; i++) {
    if (signal[i] === 1 && lastSig !== 1) {
      if (openTrade) {
        openTrade.exitTime = data[i];
        openTrade.exitPrice = data[i];
        shortTrades.push(openTrade);
      }
      openTrade = {
        entryTime: i,
        entryPrice: data[i],
        exitTime: -1,
        exitPrice: NaN,
      };
    }
    if (signal[i] === -1 && lastSig !== -1) {
      if (openTrade) {
        openTrade.exitTime = data[i];
        openTrade.exitPrice = data[i];
        longTrades.push(openTrade);
      }
      openTrade = {
        entryTime: i,
        entryPrice: data[i],
        exitTime: -1,
        exitPrice: NaN,
      };
    }
    if (signal[i] === 0 && lastSig === -1) {
      openTrade.exitTime = data[i];
      openTrade.exitPrice = data[i];
      shortTrades.push(openTrade);
      openTrade = null;
    }
    if (signal[i] === 0 && lastSig === 1) {
      openTrade.exitTime = data[i];
      openTrade.exitPrice = data[i];
      longTrades.push(openTrade);
      openTrade = null;
    }
    lastSig = signal[i];
  }
  return { longTrades, shortTrades };
}

function rollingQuantile(data, lookback, quantile) {
  return data.map((_, i) => {
    if (i < lookback) return NaN;
    let slice = data.slice(i - lookback, i).sort((a, b) => a - b);
    return slice[Math.floor(quantile * slice.length)];
  });
}

function calculateATR(highs, lows, closes, period = 772) {
  // if (highs.length < period || lows.length < period || closes.length < period) {
  //   throw new Error("Not enough data points to calculate ATR");
  // }

  let tr = [];
  let atr = [];
  let normRange = [];

  for (let i = 1; i < highs.length; i++) {
    let highLow = highs[i] - lows[i];
    let highClose = Math.abs(highs[i] - closes[i - 1]);
    let lowClose = Math.abs(lows[i] - closes[i - 1]);

    tr.push(Math.max(highLow, highClose, lowClose));
  }

  // First ATR is a simple average of the first 'period' True Range values
  let firstATR =
    tr.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  atr.push(firstATR);

  // Smooth ATR using the formula: ATR[i] = (ATR[i-1] * (period - 1) + TR[i]) / period
  for (let i = period; i < tr.length; i++) {
    let currentATR = (atr[atr.length - 1] * (period - 1) + tr[i]) / period;
    atr.push(currentATR);
  }

  // Calculate normRange
  normRange = highs.slice(period).map((high, i) => {
    return (Math.log(high) - Math.log(lows[period + i])) / atr[i];
  });

  return { atr, normRange };
}

export function processTradingSignals(ohlcvData) {
  const parsedData = ohlcvData.map(
    ([timestamp, open, high, low, close, volume]) => ({
      timestamp: new Date(timestamp),
      open,
      high,
      low,
      close,
      volume,
    })
  );
  
 
  const highs = ohlcvData.map((ohlcv) => {
    return ohlcv[2];
  });

  const lows = ohlcvData.map((ohlcv) => {
    return ohlcv[3];
  });

  const close = ohlcvData.map((ohlcv) => {
    return ohlcv[4];
  });


  const { atr, normRange } = calculateATR(highs,lows, close);

  const volHawk = hawkesProcess(normRange, 0.1);
  const signals = volSignal(
    close,
    volHawk
  );
  

    const { longTrades, shortTrades } = getTradesFromSignal(parsedData, signals);

  // console.log("LongTrades", longTrades);
  // console.log("shortTrades", shortTrades);


  return {
    longTrades,
    shortTrades,
  };
}
