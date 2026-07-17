import { AmazonFeeCalculator } from './calculators/AmazonFeeCalculator';
import { MinimumPriceCalculator } from './calculators/MinimumPriceCalculator';
import { ProfitCalculator } from './calculators/ProfitCalculator';
import { CompetitionAnalyzer } from './analyzers/CompetitionAnalyzer';
import { MarginValidator } from './validators/MarginValidator';
import { PriceStrategyEngine } from './strategies/PriceStrategyEngine';
import { SmartPriceOptimizer } from './SmartPriceOptimizer';
import { FeeStructureContext, FinancialMetrics, FinancialScore, PricingResult } from './types';

export class PricingEngine {
    private feeCalculator: AmazonFeeCalculator;
    private minPriceCalculator: MinimumPriceCalculator;
    private profitCalculator: ProfitCalculator;
    private competitionAnalyzer: CompetitionAnalyzer;
    private marginValidator: MarginValidator;
    private strategyEngine: PriceStrategyEngine;
    private optimizer: SmartPriceOptimizer;

    constructor() {
        // Initialize the decoupled architecture
        this.feeCalculator = new AmazonFeeCalculator();
        this.minPriceCalculator = new MinimumPriceCalculator(this.feeCalculator);
        this.profitCalculator = new ProfitCalculator(this.feeCalculator);
        this.competitionAnalyzer = new CompetitionAnalyzer();
        this.marginValidator = new MarginValidator();
        this.strategyEngine = new PriceStrategyEngine();
        this.optimizer = new SmartPriceOptimizer(this.strategyEngine, this.marginValidator);
    }

    async calculateOptimalPricing(
        sku: string, 
        amazonAsin: string | null, 
        cost: number, 
        context: FeeStructureContext
    ): Promise<PricingResult> {
        
        // 1. Calculate absolute minimum price (Cost + Fees + 15% Profit + 15% Commission)
        const minimumPrice = this.minPriceCalculator.calculate(cost, context);

        // 2. Analyze Competition
        const competitors = await this.competitionAnalyzer.analyze(sku, amazonAsin);
        const lowestCompetitorPrice = this.competitionAnalyzer.getLowestCompetitorPrice(competitors);

        // 3. Optimize Price based on strategy
        const { price: suggestedPrice, strategy } = this.optimizer.optimize(minimumPrice, lowestCompetitorPrice);

        // 4. Calculate final financial metrics
        const metrics = this.profitCalculator.calculateMetrics(suggestedPrice, minimumPrice, cost, context);

        // 5. Generate Financial Score
        const score = this.calculateFinancialScore(metrics, strategy, competitors.length);

        return {
            metrics,
            score,
            strategyApplied: strategy,
            competitorsAnalyzed: competitors.length
        };
    }

    private calculateFinancialScore(metrics: FinancialMetrics, strategy: string, competitorCount: number): FinancialScore {
        let scoreValue = 100;
        const reasons: string[] = [];
        let healthStatus: FinancialScore['healthStatus'] = 'EXCELLENT';

        // Margin evaluation
        if (metrics.marginPercentage < 15) {
            scoreValue -= 40;
            reasons.push('Margin is below the 15% target.');
            healthStatus = 'CRITICAL';
        } else if (metrics.marginPercentage === 15) {
            reasons.push('Operating at exact minimum target margin.');
            healthStatus = 'HEALTHY';
        } else if (metrics.marginPercentage > 25) {
            reasons.push('Excellent profit margin achieved.');
        }

        // Strategy evaluation
        if (strategy === 'COMPETITOR_TOO_LOW_KEEP_MINIMUM') {
            scoreValue -= 20;
            reasons.push('Competitors are selling below our minimum profitable price. We are not competitive.');
            if (healthStatus !== 'CRITICAL') healthStatus = 'WARNING';
        }

        if (strategy === 'NO_COMPETITION_MAXIMIZE_MARGIN') {
            reasons.push('No competition detected. Maximizing margins.');
        }

        // Ensure score is within bounds
        scoreValue = Math.max(0, Math.min(100, scoreValue));

        return {
            score: scoreValue,
            healthStatus,
            reasons
        };
    }
}
