import { AmazonFeeCalculator } from './AmazonFeeCalculator';
import { FeeStructureContext, FinancialMetrics } from '../types';

export class ProfitCalculator {
    constructor(private feeCalculator: AmazonFeeCalculator) {}

    calculateMetrics(
        suggestedPrice: number, 
        minimumPrice: number, 
        cost: number, 
        context: FeeStructureContext
    ): FinancialMetrics {
        const realFees = this.feeCalculator.calculateRealFees(context);
        const commission = this.feeCalculator.calculateCommission(suggestedPrice, context.category);
        
        const totalCost = cost + realFees + commission;
        const netProfit = suggestedPrice - totalCost;
        const marginPercentage = suggestedPrice > 0 ? (netProfit / suggestedPrice) * 100 : 0;

        return {
            cost,
            amazonRealFees: realFees,
            amazonCommission: commission,
            totalCost: Number(totalCost.toFixed(2)),
            netProfit: Number(netProfit.toFixed(2)),
            marginPercentage: Number(marginPercentage.toFixed(2)),
            suggestedPrice: Number(suggestedPrice.toFixed(2)),
            minimumPrice: Number(minimumPrice.toFixed(2))
        };
    }
}
