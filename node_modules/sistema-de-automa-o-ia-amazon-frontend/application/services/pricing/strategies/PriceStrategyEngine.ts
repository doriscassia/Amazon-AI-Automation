export type PricingStrategy = 
    | 'NO_COMPETITION_MAXIMIZE_MARGIN'
    | 'UNDERCUT_COMPETITOR'
    | 'MATCH_MINIMUM_PRICE'
    | 'COMPETITOR_TOO_LOW_KEEP_MINIMUM';

export class PriceStrategyEngine {
    determineStrategy(minimumPrice: number, lowestCompetitorPrice: number | null): PricingStrategy {
        if (lowestCompetitorPrice === null) {
            return 'NO_COMPETITION_MAXIMIZE_MARGIN';
        }

        if (lowestCompetitorPrice > minimumPrice) {
            return 'UNDERCUT_COMPETITOR';
        }

        if (lowestCompetitorPrice === minimumPrice) {
            return 'MATCH_MINIMUM_PRICE';
        }

        // Competitor is selling below our minimum profitable price
        return 'COMPETITOR_TOO_LOW_KEEP_MINIMUM';
    }
}
