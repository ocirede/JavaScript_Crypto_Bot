const resetButton = document.getElementById("resetButton");
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