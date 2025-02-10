
document.addEventListener("DOMContentLoaded", () => {
  const resetButton = document.getElementById("resetButton");
  // Fetch the trading info from the server
  fetch("/trading-info")
  .then((response) => response.json())
  .then((data) => {
    

    const tableBody = document.querySelector("#stats-table tbody");
    tableBody.innerHTML = ""; 
    data.formattedBalances.forEach((balance) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${balance.asset}</td>
        <td>${balance.free}</td>
        <td>${balance.used}</td>
        <td>${balance.total}</td>
      `;
      tableBody.appendChild(row);
    });
  })
  .catch((error) => {
    console.error("Error fetching trading info:", error);
  });



  fetch("/trades-history")
    .then((response) => response.json())
    .then((data) => {
      const trades = data;
      
      // Get the order history list element
      const tradesHistoryList = document.querySelector("#order-history-list");
      const statsWinsLosses = document.querySelector("#stats-table1 tbody");
     
     
      // Clear existing list items before adding new ones
      tradesHistoryList.innerHTML = "";
      statsWinsLosses.innerHTML= "";

      // Check if stats exist and update the stats table
    if (trades.stats) {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>Wins: ${trades.stats.wins}</td>
        <td>Losses: ${trades.stats.losses}</td>
        <td>Win Ratio: ${trades.stats.winRatio}</td>
        <td>Loss Ratio: ${trades.stats.lossRatio}</td>

        `;
      statsWinsLosses.appendChild(row);
    } else {
      console.warn("Stats not found in response.");
    }


      // Loop through the trades and create list items
      trades.tradesHistory.forEach((trade, index) => {
        const listItem = document.createElement("li");
        // Format the trade data as needed
        const tradeInfo = `
          Order #${index + 1}: 
          ${trade.side} ${trade.amount} ${trade.symbol} at ${trade.price}
          (Fee: ${trade.fee ? trade.fee.cost : 0} ${
          trade.fee ? trade.fee.currency : ""
        })
        `;

        // Set the text content for the list item
        listItem.textContent = tradeInfo;

        // Append the list item to the order history list
        tradesHistoryList.appendChild(listItem);
      });
    })
    .catch((error) => {
      console.error("Error fetching trades history:", error);
    });

  fetch("/open-orders")
    .then((response) => response.json())
    .then((data) => {
      const openOrders = data;

      const openOrdersList = document.querySelector("#trade-status-list");
      openOrdersList.innerHTML = "";
      openOrders.forEach((order, index) => {
        const listItem = document.createElement("li");

        const orderInfo = `
      ORDER #${index + 1}:\n
      Date: ${order.dateTime},\n
      Status: ${order.status},\n
      Symbol: ${order.symbol},\n
      Side: ${order.side},\n
      Price: ${order.price},\n
      Amount: ${order.amount},\n
      Cost: ${order.cost},\n
      `;

        listItem.textContent = orderInfo;

        openOrdersList.appendChild(listItem);
      });
    })
    .catch((error) => {
      console.error("Error fetching open orders:", error);
    });


  resetButton.addEventListener("click", async () => {
    try {
      const response = await fetch("/reset-trading", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      alert(data.message);
    } catch (error) {
      alert("Failed to reset trading. Check the console for details.");
      console.error(error);
    }
  });
});

