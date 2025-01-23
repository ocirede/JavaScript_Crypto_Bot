// Function to fetch and update the chart
function fetchAndUpdateChart() {
  Promise.all([
    d3.csv("/ohlcv_BTC-USDT_30m.csv"),
    d3.csv("/indicators_BTC-USDT_30m.csv"),
  ])
    .then(([ohlcvRows, indicatorsRows]) => {
      // Helper function to unpack columns
      function unpack(rows, key) {
        return rows.map((row) => row[key]);
      }

      // Helper function to match indicators to OHLCV by timestamp
      function mergeData(ohlcv, indicators) {
        const indicatorsMap = new Map(
          indicators.map((row) => [row.timestamp, row])
        );
        return ohlcv.map((row) => ({
          ...row,
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
        increasing: { line: { color: "white" } },
        decreasing: { line: { color: "purple" } },
        type: "candlestick",
        xaxis: "x",
        yaxis: "y",
        name: "Price",
        visible: true,
      };

      // Define the Bollinger Bands traces
      const bbMiddleTrace = {
        x: unpack(mergedData, "timestamp"),
        y: unpack(mergedData, "bbMiddle"),
        mode: "lines",
        name: "BB Middle",
        line: { color: "white", width: 2 },
        visible: false,
      };

      const bbUpperTrace = {
        x: unpack(mergedData, "timestamp"),
        y: unpack(mergedData, "bbUpper"),
        mode: "lines",
        name: "BB Upper",
        line: { color: "purple", width: 2 },
        visible: false,
      };

      const bbLowerTrace = {
        x: unpack(mergedData, "timestamp"),
        y: unpack(mergedData, "bbLower"),
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
        line: { color: "orange" },
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
      const histogramData = unpack(mergedData, "histogram");
      const trend = unpack(mergedData, "trend");
      const macdHistogramTrace = {
        x: unpack(mergedData, "timestamp"),
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
        x: unpack(mergedData, "timestamp"),
        y: unpack(mergedData, "signal"),
        mode: "lines",
        name: "MACD Signal",
        line: { color: "orange" },
        yaxis: "y3",
        visible: false,
      };

      const macdTrace = {
        x: unpack(mergedData, "timestamp"),
        y: unpack(mergedData, "macd"),
        mode: "lines",
        name: "MACD",
        line: { color: "blue" },
        yaxis: "y3",
        visible: false,
      };

      // Define spike markers for TR
      const spikesTrace = {
        x: unpack(mergedData, "timestamp"),
        y: unpack(mergedData, "spikes"),
        mode: "markers",
        name: "Spikes",
        marker: { size: 10, color: "red", symbol: "cross" },
        visible: false,
      };

      // Define Kalman filter
      const kalman = {
        x: unpack(mergedData, "timestamp"),
        y: unpack(mergedData, "kalman"),
        mode: "lines",
        name: "Kalman",
        line: { color: "yellow" },
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
      const invertedTrend = trend.map((value) => -value);
      const trendTrace = {
        x: unpack(mergedData, "timestamp"),
        y: invertedTrend,
        type: "bar",
        name: "Trend",
        marker: {
          color: invertedTrend.map((value) =>
            value >= 0 ? "darkgrey" : "indigo"
          ),
        },
        opacity: 0.3,
        yaxis: "y3",
        visible: false,
      };
      const trendOverlayTrace = {
        x: unpack(mergedData, "timestamp"),
        y: invertedTrend.map((value) => value * 1.05),
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

      const pocPrices = mergedData.map((data) => data.pocPrice);
      const vahPrices = mergedData.map((data) => data.vah);
      const valPrices = mergedData.map((data) => data.val);

      // Create traces for the POC, VAH, and VAL lines
      const pocLineTrace = {
        x: unpack(ohlcvRows, "timestamp"), 
        y: pocPrices,
        type: "scatter",
        mode: "lines",
        name: "POC",
        line: { color: "blue", width: 2 },
        visible: false,

      };

      const vahLineTrace = {
        x: unpack(ohlcvRows, "timestamp"),
        y: vahPrices,
        type: "scatter",
        mode: "lines",
        name: "VAH",
        line: { color: "green", width: 2 },
        visible: false,

      };

      const valLineTrace = {
        x: unpack(ohlcvRows, "timestamp"),
        y: valPrices,
        type: "scatter",
        mode: "lines",
        name: "VAL",
        line: { color: "red", width: 2 },
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
        spikesTrace,
        kalman,
        bestFitLine,
        support,
        resistance,
        trendTrace,
        trendOverlayTrace,
        pocLineTrace,
        vahLineTrace,
        valLineTrace,
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
        },
        
        yaxis3: {
          title: "MACD",
          overlaying: "y",
          side: "right",
          autorange: true,
        },

       

        updatemenus: [
          {
            buttons: [
              {
                label: "Candlestick",
                method: "restyle",
                args: [{ visible: [true] }, [0]],
              },
              {
                label: "Bollinger Bands",
                method: "restyle",
                args: [{ visible: [true, true, true] }, [1, 2, 3]],
              },
              {
                label: "EMA",
                method: "restyle",
                args: [{ visible: [true, true, true] }, [4, 5, 6]],
              },
              {
                label: "MACD",
                method: "restyle",
                args: [{ visible: [true, true, true] }, [7, 8, 9]],
              },
              {
                label: "Spikes",
                method: "restyle",
                args: [{ visible: [true] }, [10]],
              },
              {
                label: "Kalman",
                method: "restyle",
                args: [{ visible: [true] }, [11]],
              },
              {
                label: "BestFitLine",
                method: "restyle",
                args: [{ visible: [true] }, [12]],
              },
              {
                label: "Support",
                method: "restyle",
                args: [{ visible: [true] }, [13]],
              },
              {
                label: "Resistance",
                method: "restyle",
                args: [{ visible: [true] }, [14]],
              },
              {
                label: "Trend",
                method: "restyle",
                args: [{ visible: [true] }, [15]],
              },
              {
                label: "TrendLine",
                method: "restyle",
                args: [{ visible: [true] }, [16]],
              },
              {
                label: "Poc-Vah-Val",
                method: "restyle",
                args: [{ visible: [true] }, [17, 18, 19]],
              },
              {
                label: "Real-Time Price",
                method: "restyle",
                args: [{ visible: [true] }, [20]],
              },
             

              {
                label: "Deselect all",
                method: "restyle",
                args: [
                  { visible: [false] },
                  [
                    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
                    18, 19, 20
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

    if (!chartData || !chartData[20]) {
      console.error("Real-time trace data is not available!");
      isUpdating = false;
      return;
    }

    // Ensure the real-time price trace is visible
    const isRealTimeVisible = chartData[20].visible !== false;

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
          [20],
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

// Fetch data and update chart initially
fetchAndUpdateChart();
