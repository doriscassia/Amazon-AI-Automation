export interface FeeStructureContext {
    category: string;
    weight: number;
    dimensions: {
        length: number;
        width: number;
        height: number;
    };
    price: number;
    // Prepared for future Amazon fee updates (e.g., storage tier, seasonality)
    seasonality?: 'PEAK' | 'OFF_PEAK';
    fulfillmentType?: 'FBA' | 'FBM';
}

export interface FinancialMetrics {
    cost: number;
    amazonRealFees: number;
    amazonCommission: number;
    totalCost: number;
    netProfit: number;
    marginPercentage: number;
    suggestedPrice: number;
    minimumPrice: number;
}

export interface CompetitorData {
    competitorId: string;
    sellerName: string;
    price: number;
    shippingCost: number;
    totalPrice: number;
    isBuyBoxWinner: boolean;
    isFBA: boolean;
}

export interface FinancialScore {
    score: number; // 0 to 100
    healthStatus: 'CRITICAL' | 'WARNING' | 'HEALTHY' | 'EXCELLENT';
    reasons: string[];
}

export interface PricingResult {
    metrics: FinancialMetrics;
    score: FinancialScore;
    strategyApplied: string;
    competitorsAnalyzed: number;
}
