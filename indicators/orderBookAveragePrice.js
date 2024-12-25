// ASk-Bid-quantity and Average price
export const orderBookAveragePrice = (orderbook) => {
    const calculateWeightedAverage = (orders) => {
      let totalCost = 0;
      let totalQuantity = 0;
  
      orders.forEach(([price, quantity]) => {
        totalCost += price * quantity;
        totalQuantity += quantity;
      });
  
      const averagePrice = totalQuantity === 0 ? 0 : totalCost / totalQuantity;
      return { averagePrice, totalQuantity };
    };
  
    const bidResults = calculateWeightedAverage(orderbook.bids);
    const askResults = calculateWeightedAverage(orderbook.asks);
    const totalBidQuantity = bidResults.totalQuantity;
    const totalAskQuantity = askResults.totalQuantity;
    const averageBidPrice = bidResults.averagePrice;
    const averageAskPrice = askResults.averagePrice;
    const spread = averageBidPrice - averageAskPrice;
    return {
      totalBidQuantity: totalBidQuantity,
      averageBidPrice: averageBidPrice,
      totalAskQuantity: totalAskQuantity,
      averageAskPrice: averageAskPrice,
      spread: spread,
    };
  };