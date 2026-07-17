import { CompetitorData } from '../types';

export class CompetitionAnalyzer {
    /**
     * Analyzes current market competition.
     * Currently a structural placeholder. Will integrate with Amazon SP-API or scraping engines in the future.
     */
    async analyze(sku: string, amazonAsin: string | null): Promise<CompetitorData[]> {
        // Architectural contract established.
        // No external calls implemented in this phase.
        return [];
    }

    getLowestCompetitorPrice(competitors: CompetitorData[]): number | null {
        if (!competitors || competitors.length === 0) {
            return null;
        }
        
        // Find the absolute lowest total price (price + shipping)
        const lowest = competitors.reduce((min, current) => {
            return current.totalPrice < min.totalPrice ? current : min;
        });

        return lowest.totalPrice;
    }
}
