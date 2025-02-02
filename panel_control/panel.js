document.addEventListener("DOMContentLoaded", () => {

const resetButton = document.getElementById("resetButton");
  // Fetch the trading info from the server
  fetch("/trading-info")
    .then((response) => response.json())
    .then((data) => {
      // Process the data and update the page
      const stats = [
        { Metric: "Initial Balance", Value: `${data.formattedBalances}` },
      ];

      const tableBody = document.querySelector("#stats-table tbody");
      tableBody.innerHTML = ''; 
      // Populate the table with stats
      stats.forEach((stat) => {
        const row = document.createElement("tr");
        const metricCell = document.createElement("td");
        const valueCell = document.createElement("td");

        metricCell.textContent = stat.Metric;
        valueCell.textContent = stat.Value;

        row.appendChild(metricCell);
        row.appendChild(valueCell);
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
  
      // Clear existing list items before adding new ones
      tradesHistoryList.innerHTML = '';
  
      // Loop through the trades and create list items
      trades.forEach((trade, index) => {
        const listItem = document.createElement("li");
  
        // Format the trade data as needed
        const tradeInfo = `
          Order #${index + 1}: 
          ${trade.side} ${trade.amount} ${trade.symbol} at ${trade.price}
          (Fee: ${trade.fee ? trade.fee.cost : 0} ${trade.fee ? trade.fee.currency : ''})
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