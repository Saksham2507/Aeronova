const demandSensingService = {
  calculateDemandScore: (signals) => {
    const weights = {
      posData: 0.20,
      weatherAlert: 0.25,
      searchTrends: 0.20,
      ecommerceSales: 0.20,
      promotionIntensity: 0.10,
      supplierCapacity: 0.05
    };

    let score = 0;
    for (const [key, weight] of Object.entries(weights)) {
      score += (signals[key] || 0) * weight;
    }
    return Math.round(score);
  },

  generateForecast: (score) => {
    const baseValue = 100;
    const variance = baseValue * 0.3;
    
    return {
      p10: Math.round(baseValue - variance),
      p50: Math.round(baseValue + (score / 100) * variance),
      p90: Math.round(baseValue + variance)
    };
  }
};

module.exports = demandSensingService;