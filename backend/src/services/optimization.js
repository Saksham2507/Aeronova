const optimizationService = {
  calculateSafetyStock: (avgDemand, stdDev, serviceLevel) => {
    const zScore = serviceLevel === 0.95 ? 1.65 : serviceLevel === 0.99 ? 2.33 : 1.28;
    return Math.round(zScore * stdDev * Math.sqrt(7));
  },

  calculateEOQ: (annualDemand, orderingCost, holdingCost) => {
    return Math.round(Math.sqrt((2 * annualDemand * orderingCost) / holdingCost));
  },

  optimizeInventory: (data) => {
    return {
      recommendedStock: data.avgDemand * 7,
      safetyStock: optimizationService.calculateSafetyStock(data.avgDemand, data.stdDev, 0.95),
      eoq: optimizationService.calculateEOQ(data.annualDemand, 50, 2)
    };
  }
};

module.exports = optimizationService;