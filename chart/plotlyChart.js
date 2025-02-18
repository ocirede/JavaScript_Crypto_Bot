// Function to fetch and update the chart
export function fetchAndUpdateChart(timeframe = "30m") {
  Promise.all([
    d3.csv(`/ohlcv_BTC-USDT_${timeframe}.csv`),
    d3.csv(`/indicators_BTC-USDT_${timeframe}.csv`),
    d3.csv(`/priceAnalysis${timeframe}.csv`),
  ])
    .then(([ohlcvRows, indicatorsRows, analysis]) => {
      // Helper function to unpack columns and convert to numbers
      function unpack(rows, key) {
        return rows.map((row) => row[key]);
      }

      // Helper function to match indicators to OHLCV by timestamp
      function mergeData(ohlcv, indicators) {
        const indicatorsMap = new Map(
          indicators.map((row) => [row.timestamp, row])
        );
        return ohlcv.map((row, index) => ({
          ...row,
          index: index,
          ...indicatorsMap.get(row.timestamp),
        }));
      }

      // Merge the two datasets
      const mergedData = mergeData(ohlcvRows, indicatorsRows);

      // Get today's date and calculate 4 months backward
      const today = new Date();
      const fourMonthsAgo = new Date();
      fourMonthsAgo.setMonth(today.getMonth() - 4);

      // Format dates as ISO strings for Plotly
      const todayISO = today.toISOString().split("T")[0];
      const fourMonthsAgoISO = fourMonthsAgo.toISOString().split("T")[0];

      // Define the candlestick trace
      const candlestickTrace = {
        x: unpack(mergedData, "timestamp"),
        open: unpack(mergedData, "open"),
        high: unpack(mergedData, "high"),
        low: unpack(mergedData, "low"),
        close: unpack(mergedData, "close"),
        text: unpack(mergedData, "index"),
        increasing: { line: { color: "green" } },
        decreasing: { line: { color: "red" } },
        type: "candlestick",
        xaxis: "x",
        yaxis: "y",
        name: "Price",
        visible: true,
      };

      // Define the period used for Bollinger Bands calculation
      const bbPeriod = 20;

      // Trim the merged data to exclude the first 'bbPeriod' entries
      const trimmedData = mergedData.slice(bbPeriod);

      // Define the Bollinger Bands traces
      const bbMiddleTrace = {
        x: unpack(trimmedData, "timestamp"),
        y: unpack(trimmedData, "bbMiddle"),
        mode: "lines",
        name: "BB Middle",
        line: { color: "white", width: 2 },
        visible: false,
      };

      const bbUpperTrace = {
        x: unpack(trimmedData, "timestamp"),
        y: unpack(trimmedData, "bbUpper"),
        mode: "lines",
        name: "BB Upper",
        line: { color: "purple", width: 2 },
        visible: false,
      };

      const bbLowerTrace = {
        x: unpack(trimmedData, "timestamp"),
        y: unpack(trimmedData, "bbLower"),
        mode: "lines",
        name: "BB Lower",
        line: { color: "purple", width: 2 },
        visible: false,
      };

      // Define the EMA traces
      const ema55Trace = {
        x: unpack(mergedData, "timestamp"),
        y: unpack(mergedData, "ema55"),
        mode: "lines",
        name: "EMA 55",
        line: { color: " pink" },
        visible: false,
      };

      const ema400 = unpack(mergedData, "ema400");
      const ema400Trace = {
        x: unpack(mergedData, "timestamp"),
        y: ema400,
        mode: "lines",
        name: "EMA 400",
        line: { color: "white" },

        visible: false,
      };
      const ema800 = unpack(mergedData, "ema800");
      const ema800Trace = {
        x: unpack(mergedData, "timestamp"),
        y: ema800,
        mode: "lines",
        name: "EMA 800",
        line: { color: "purple" },
        visible: false,
      };

      // Define Macd
      const histogramData = unpack(trimmedData, "histogram");
      const trend = unpack(trimmedData, "trend");
      const macdHistogramTrace = {
        x: unpack(trimmedData, "timestamp"),
        y: histogramData,
        type: "bar",
        name: "MACD Histogram",
        marker: {
          color: histogramData.map((value) => (value > 0 ? "white" : "purple")),
        },
        yaxis: "y3",
        visible: false,
      };

      const macdSignalTrace = {
        x: unpack(trimmedData, "timestamp"),
        y: unpack(trimmedData, "signal"),
        mode: "lines",
        name: "MACD Signal",
        line: { color: "orange" },
        yaxis: "y3",
        visible: false,
      };

      const macdTrace = {
        x: unpack(trimmedData, "timestamp"),
        y: unpack(trimmedData, "macd"),
        mode: "lines",
        name: "MACD",
        line: { color: "blue" },
        yaxis: "y3",
        visible: false,
      };

      // Define Best trend fit line
      const bestFitLine = {
        x: unpack(mergedData, "timestamp"),
        y: unpack(mergedData, "slope"),
        mode: "lines",
        name: "RegressionSlope",
        line: { color: "white", width: 2 },
        visible: false,
      };
      // Define dynamic support levels
      const support = {
        x: unpack(mergedData, "timestamp"),
        y: unpack(mergedData, "support"),
        mode: "lines",
        name: "SupportLevel",
        line: { color: "green", width: 2 },
        visible: false,
      };
      // Define dynamic resistnce levels
      const resistance = {
        x: unpack(mergedData, "timestamp"),
        y: unpack(mergedData, "resistance"),
        mode: "lines",
        name: "ResistanceLevel",
        line: { color: "red", width: 2 },
        visible: false,
      };

      // Define volume trend for Macd
      const trendTrace = {
        x: unpack(trimmedData, "timestamp"),
        y: trend,
        type: "bar",
        name: "Trend",
        marker: {
          color: trend.map((value) => (value >= 0 ? "grey" : "indigo")),
        },
        opacity: 0.3,
        yaxis: "y3",
        visible: false,
      };
      const trendOverlayTrace = {
        x: unpack(trimmedData, "timestamp"),
        y: trend.map((value) => value * 1.05),
        type: "scatter",
        mode: "lines",
        name: "Trend Overlay",
        line: {
          color: "lime",
          width: 2,
        },
        yaxis: "y3",
        visible: false,
      };

      // Define Atr
      const atrTrace = {
        x: unpack(trimmedData, "timestamp"),
        y: unpack(trimmedData, "atr"),
        mode: "lines",
        name: "ATR",
        line: { color: "orange", width: 2 },
        yaxis: "y2",
        visible: false,
      };

      const adx = unpack(trimmedData, "adx");
      const AdxOverlayAtr = {
        x: unpack(trimmedData, "timestamp"),
        y: adx,
        type: "scatter",
        mode: "lines",
        name: "Adx",
        line: {
          color: "lime",
          width: 2,
        },
        yaxis: "y2",
        visible: false,
      };

      // Define RSI trace with filtered values
      const rsiTrace = {
        x: unpack(trimmedData, "timestamp"),
        y: unpack(trimmedData, "rsi"),
        mode: "lines",
        name: "RSI",
        line: { color: "orange", width: 2, shape: "hv", smoothing: 1.5 },
        yaxis: "y2",
        visible: false,
      };

      // Empty trace for real-time price updates
      const realTimeTrace = {
        x: [],
        y: [],
        mode: "markers+text",
        name: "Real-Time Price",
        text: [],
        textposition: "top center",
        marker: {
          size: 12,
          color: "yellow",
        },
        visible: false,
      };

      // Mapping analysis data into annotations
      const annotations = analysis.map((result, index) => {
        return {
          x: 0.1 + index * 0.12,
          y: 0.02,
          xref: "paper",
          yref: "paper",
          text: `${result.Field}: ${result.Value}`,
          showarrow: false,
          font: {
            family: "Arial, sans-serif",
            size: 18,
            color: "black",
          },
          align: "center",
          bgcolor: "yellow",
          borderpad: 10,
          bordercolor: "black",
          borderwidth: 1,
          opacity: 0.8,
        };
      });

      // Define the data array
      const data = [
        candlestickTrace,
        bbMiddleTrace,
        bbUpperTrace,
        bbLowerTrace,
        ema55Trace,
        ema400Trace,
        ema800Trace,
        macdHistogramTrace,
        macdSignalTrace,
        macdTrace,
        bestFitLine,
        support,
        resistance,
        trendTrace,
        trendOverlayTrace,
        atrTrace,
        AdxOverlayAtr,
        rsiTrace,
        realTimeTrace,
      ];

      // Chart layout
      const layout = {
        title: { text: "BTC Chart with Indicators" },
        font: { color: "white" },
        dragmode: "zoom",
        showlegend: false,
        paper_bgcolor: "black",
        plot_bgcolor: "black",
        margin: { l: 50, r: 50, t: 30, b: 40 },
        shapes: [
          {
            type: "rect",
            x0: 0,
            x1: 1,
            y0: 0,
            y1: 1,
            xref: "paper",
            yref: "paper",
            line: {
              color: "white",
              width: 2,
            },
          },
        ],
        xaxis: {
          autorange: true,
          range: [fourMonthsAgoISO, todayISO],
          rangeselector: {
            buttons: [
              {
                count: 1,
                label: "1m",
                step: "month",
                stepmode: "backward",
              },
              {
                count: 4,
                label: "4m",
                step: "month",
                stepmode: "backward",
              },
              { step: "all", label: "All" },
            ],
            font: { color: "black" },
          },
          rangeslider: {
            visible: false,
            range: [fourMonthsAgoISO, todayISO],
          },
          type: "date",
        },
        yaxis: {
          title: "Price",
          side: "right",
          autorange: true,
          showgrid: true,
          zeroline: true,
          visible: true,
        },

        yaxis2: {
          title: "ATR && ADX",
          overlaying: "y",
          side: "left",
          position: 0.02,
          showgrid: false,
          zeroline: true,
      },
      
      yaxis3: {
          title: "MACD",
          overlaying: "y",
          side: "left",
          position: 0.01, 
          showgrid: false,
          zeroline: true,
      },

        annotations: annotations,

        updatemenus: [
          {
            buttons: [
              {
                label: "Candlestick",
                method: "restyle",
                args: [{ visible: [true] }, [0]],
                args2: [{ visible: [false] }, [0]],
              },
              {
                label: "Bollinger Bands",
                method: "restyle",
                args: [{ visible: [true, true, true] }, [1, 2, 3]],
                args2: [{ visible: [false, false, false] }, [1, 2, 3]],
              },
              {
                label: "EMA",
                method: "restyle",
                args: [{ visible: [true, true, true] }, [4, 5, 6]],
                args2: [{ visible: [false, false, false] }, [4, 5, 6]],
              },
              {
                label: "MACD",
                method: "restyle",
                args: [{ visible: [true, true, true] }, [7, 8, 9]],
                args2: [{ visible: [false, false, false] }, [7, 8, 9]],
              },

              {
                label: "BestFitLine",
                method: "restyle",
                args: [{ visible: [true] }, [10]],
                args2: [{ visible: [false] }, [10]],
              },
              {
                label: "Support",
                method: "restyle",
                args: [{ visible: [true] }, [11]],
                args2: [{ visible: [false] }, [11]],
              },
              {
                label: "Resistance",
                method: "restyle",
                args: [{ visible: [true] }, [12]],
                args2: [{ visible: [false] }, [12]],
              },
              {
                label: "Trend",
                method: "restyle",
                args: [{ visible: [true] }, [13]],
                args2: [{ visible: [false] }, [13]],
              },
              {
                label: "TrendLine",
                method: "restyle",
                args: [{ visible: [true] }, [14]],
                args2: [{ visible: [false] }, [14]],
              },

              {
                label: "Atr",
                method: "restyle",
                args: [{ visible: [true] }, [15]],
                args2: [{ visible: [false] }, [15]],
              },

              {
                label: "Adx",
                method: "restyle",
                args: [{ visible: [true] }, [16]],
                args2: [{ visible: [false] }, [16]],
              },
              {
                label: "Rsi",
                method: "restyle",
                args: [{ visible: [true] }, [17]],
                args2: [{ visible: [false] }, [17]],
              },

              {
                label: "Real-Time Price",
                method: "restyle",
                args: [{ visible: [true] }, [18]],
                args2: [{ visible: [false] }, [18]],
              },

              {
                label: "Deselect all",
                method: "restyle",
                args: [
                  { visible: [false] },
                  [
                    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
                    18,
                  ],
                ],
              },
            ],
            direction: "down",
            showactive: true,
            x: 0.1,
            y: 1.15,
            xanchor: "left",
            yanchor: "top",
            bgcolor: "yellow",
            font: {color: "black"}
          },
        ],
      };

      // Plot the chart
      Plotly.newPlot("myDiv", data, layout);

      // Start WebSocket for real-time updates
      setupRealTimeUpdates();
    })
    .catch((error) => {
      console.error("Error loading the CSV file:", error);
    });
}

// Function to handle WebSocket real-time updates
function setupRealTimeUpdates() {
  const socket = new WebSocket(window.env.WEBSOCKET_URL);
  let updateQueue = [];
  let isUpdating = false;

  socket.onopen = () => {
    console.log("Connected to WebSocket server");
  };

  socket.onclose = () => {
    console.log("Disconnected from WebSocket server");
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const newPrice = data.price;

    if (newPrice != null) {
      const currentDate = new Date().toISOString();

      // Add the update to the queue
      updateQueue.push({
        x: currentDate,
        y: newPrice,
        text: `${newPrice.toFixed(2)}`,
      });

      // Process the queue if not already processing
      if (!isUpdating) {
        processUpdateQueue();
      }
    }
  };

  function processUpdateQueue() {
    if (updateQueue.length === 0) {
      isUpdating = false;
      return;
    }

    isUpdating = true;

    // Render all queued updates
    const latestUpdate = updateQueue.pop();
    updateQueue = [];

    // Get current chart data
    const chartElement = document.getElementById("myDiv");
    const chartData = chartElement?.data;

    if (!chartData || !chartData[18]) {
      console.error("Real-time trace data is not available!");
      isUpdating = false;
      return;
    }

    // Ensure the real-time price trace is visible
    const isRealTimeVisible = chartData[18].visible !== false;

    // Only update the real-time price trace if it is visible
    if (isRealTimeVisible) {
      try {
        // Store the visibility of each trace
        const visibilityStates = chartData.map((trace) => trace.visible);

        // Update only the real-time price trace
        Plotly.extendTraces(
          "myDiv",
          {
            x: [[latestUpdate.x]],
            y: [[latestUpdate.y]],
            text: [[latestUpdate.text]],
          },
          [18],
          50,
          {
            // Pass layout parameters to ensure other traces stay visible
            visible: visibilityStates,
          }
        ).then(() => {
          // Force redraw to ensure changes are visible
          Plotly.redraw("myDiv");
        });
      } catch (error) {
        console.error("Error during Plotly.extendTraces:", error);
      }
    } else {
      console.log("Real-time trace is not visible, skipping update");
    }

    // Continue processing the queue if there are more updates
    if (updateQueue.length > 0) {
      processUpdateQueue();
    } else {
      isUpdating = false;
    }
  }
}

// Select all timeframe buttons
const buttons = document.querySelectorAll("button[id^='btn-']");

// Function to reset all button colors
function resetButtonColors() {
  buttons.forEach((btn) => (btn.style.background = "white"));
}

// Add event listeners to each button
buttons.forEach((button) => {
  button.addEventListener("click", (event) => {
    resetButtonColors();
    event.target.style.background = "yellow";
    fetchAndUpdateChart(event.target.innerText.split(" ")[0]);
  });
});

// Fetch data and update chart initially

fetchAndUpdateChart();
