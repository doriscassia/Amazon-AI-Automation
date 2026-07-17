import { FeeStructureContext } from '../types';

export class AmazonFeeCalculator {
    /**
     * Calculates the real Amazon fees (e.g., FBA fulfillment fees, shipping).
     * Architecture prepared to support category, weight, dimensions, and future rules.
     */
    calculateRealFees(context: FeeStructureContext): number {
        // Base logic placeholder for architectural foundation.
        // In production, this would use a rule engine or database table with Amazon's current fee tiers.
        let baseFee = 0;

        // Example of weight-based tiering structure
        if (context.weight <= 0.5) {
            baseFee = 15.00;
        } else if (context.weight <= 1.0) {
            baseFee = 20.00;
        } else {
            baseFee = 20.00 + Math.ceil(context.weight - 1.0) * 5.00;
        }

        // Example of category-specific extra fees
        if (context.category.toUpperCase() === 'ELETRONICOS') {
            baseFee += 2.50;
        }

        return baseFee;
    }

    /**
     * Calculates the Amazon referral fee (commission).
     * Fixed at 15% as per mandatory rules, but architected to accept category overrides if Amazon changes policies.
     */
    calculateCommission(price: number, category: string): number {
        const COMMISSION_RATE = 0.15; // 15%
        return price * COMMISSION_RATE;
    }
}
