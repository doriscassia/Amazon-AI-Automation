import { PriceStrategyEngine, PricingStrategy } from './strategies/PriceStrategyEngine';
import { MarginValidator } from './validators/MarginValidator';

export class SmartPriceOptimizer {
    private readonly UNDERCUT_AMOUNT = 0.05; // Few cents below competitor
    private readonly NO_COMPETITION_MARKUP = 1.20; // 20% markup if no competition

    constructor(
        private strategyEngine: PriceStrategyEngine,
        private marginValidator: MarginValidator
    ) {}

    optimize(minimumPrice: number, lowestCompetitorPrice: number | null): { price: number, strategy: PricingStrategy } {
        const strategy = this.strategyEngine.determineStrategy(minimumPrice, lowestCompetitorPrice);
        let suggestedPrice = minimumPrice;

        switch (strategy) {
            case 'NO_COMPETITION_MAXIMIZE_MARGIN':
                suggestedPrice = minimumPrice * this.NO_COMPETITION_MARKUP;
                break;
            
            case 'UNDERCUT_COMPETITOR':
                if (lowestCompetitorPrice !== null) {
                    suggestedPrice = lowestCompetitorPrice - this.UNDERCUT_AMOUNT;
                }
                break;
                
            case 'MATCH_MINIMUM_PRICE':
            case 'COMPETITOR_TOO_LOW_KEEP_MINIMUM':
                suggestedPrice = minimumPrice;
                break;
        }

        // Final safety check: Never sell below minimum price
        suggestedPrice = this.marginValidator.enforceMinimum(suggestedPrice, minimumPrice);

        return {
            price: Number(suggestedPrice.toFixed(2)),
            strategy
        };
    }
}
