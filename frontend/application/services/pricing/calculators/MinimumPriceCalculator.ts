import { AmazonFeeCalculator } from './AmazonFeeCalculator';
import { FeeStructureContext } from '../types';

export class MinimumPriceCalculator {
    private readonly TARGET_PROFIT_MARGIN = 0.15; // 15%
    private readonly AMAZON_COMMISSION_RATE = 0.15; // 15%

    constructor(private feeCalculator: AmazonFeeCalculator) {}

    /**
     * Mandatory Rule:
     * Minimum Price = Cost + Amazon Real Fees + 15% Profit + 15% Amazon Commission
     * 
     * Mathematical derivation:
     * P = Cost + Fees + (0.15 * P) + (0.15 * P)
     * P - 0.30 * P = Cost + Fees
     * 0.70 * P = Cost + Fees
     * P = (Cost + Fees) / 0.70
     */
    calculate(cost: number, context: FeeStructureContext): number {
        const realFees = this.feeCalculator.calculateRealFees(context);
        
        const combinedMargin = this.TARGET_PROFIT_MARGIN + this.AMAZON_COMMISSION_RATE; // 0.30
        const divisor = 1 - combinedMargin; // 0.70

        const minimumPrice = (cost + realFees) / divisor;
        
        return Number(minimumPrice.toFixed(2));
    }
}
