import { realTimePrice } from "../webSocket/webSocket.js";

document.addEventListener("DOMContentLoaded", () => {

const resetButton = document.getElementById("resetButton");
const last = realTimePrice
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

const stats = [
  { Metric: "Real Time Price", Value: last },
  { Metric: "Initial Balance", Value: `${initialBalance} VST` },
  { Metric: "Percentage Wins", Value: `${percentageWin.toFixed(2)}%` },
  { Metric: "Percentage Losses", Value: `${percentageLoss.toFixed(2)}%` },
  { Metric: "Current Balance", Value: `${currentBalance.toFixed(2)} VST` },
];
});