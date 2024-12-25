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
        increasing: { line: { color: "green" } },
        decreasing: { line: { color: "red" } },
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
        line: { color: "white" },
        visible: false,
      };

      const bbUpperTrace = {
        x: unpack(mergedData, "timestamp"),
        y: unpack(mergedData, "bbUpper"),
        mode: "lines",
        name: "BB Upper",
        line: { color: "turquoise" },
        visible: false,
      };

      const bbLowerTrace = {
        x: unpack(mergedData, "timestamp"),
        y: unpack(mergedData, "bbLower"),
        mode: "lines",
        name: "BB Lower",
        line: { color: "turquoise", dash: "dot" },
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

      const ema400Trace = {
        x: unpack(mergedData, "timestamp"),
        y: unpack(mergedData, "ema400"),
        mode: "lines",
        name: "EMA 400",
        line: { color: "purple" },
        visible: false,
      };

      const ema800Trace = {
        x: unpack(mergedData, "timestamp"),
        y: unpack(mergedData, "ema800"),
        mode: "lines",
        name: "EMA 800",
        line: { color: "pink" },
        visible: false,
      };

      const histogramData = unpack(mergedData, "histogram"); 
      const macdHistogramTrace = {
        x: unpack(mergedData, "timestamp"),
        y: histogramData,
        type: "bar", 
        name: "MACD Histogram",
        marker: {
          color: histogramData.map((value) => (value > 0 ? "green" : "red")), 
        },
        yaxis: "y3",
        visible: false, 
      };

      const macdSignalTrace = {
        x: unpack(mergedData, "timestamp"),
        y: unpack(mergedData, "signal"),
        mode: "lines",
        name: "MACD Signal",
        line: { color: "red" },
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

      const Volume = {
        x: unpack(mergedData, "timestamp"),
        y: unpack(mergedData, "volume"),
        type: "bar",
        name: "Volume",
        xaxis: "x",
        yaxis: "y2",
        marker: { color: "blue" },
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
        realTimeTrace,
        Volume,
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
        yaxis2: {
          title: "Volume",
          side: "left",
          overlaying: "y",
          autorange: true,
        },

        yaxis3: {
          title: "MACD Histogram",
          overlaying: "y",
          side: "right",
          position: 1.1,
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
                args: [{ visible: [true, true] }, [7, 8, 9]],
              },
              {
                label: "Spikes",
                method: "restyle",
                args: [{ visible: [true] }, [10]],
              },
              {
                label: "Real-Time Price",
                method: "restyle",
                args: [{ visible: [true] }, [11]],
              },
              {
                label: "Volume",
                method: "restyle",
                args: [{ visible: [true] }, [12]],
              },

              {
                label: "Deselect all",
                method: "restyle",
                args: [
                  { visible: [false] },
                  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
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

    if (!chartData || !chartData[11]) {
      console.error("Real-time trace data is not available!");
      isUpdating = false;
      return;
    }

    // Ensure the real-time price trace (index 11) is visible
    const isRealTimeVisible = chartData[11].visible !== false;

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
          [11],
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
