export class MarginValidator {
    /**
     * Ensures the price never drops below the calculated minimum price.
     * This is a critical safety net for the automation engine.
     */
    isValid(price: number, minimumPrice: number): boolean {
        // Using a small epsilon to handle floating point precision issues
        const EPSILON = 0.001;
        return price >= (minimumPrice - EPSILON);
    }

    enforceMinimum(price: number, minimumPrice: number): number {
        if (!this.isValid(price, minimumPrice)) {
            return minimumPrice;
        }
        return price;
    }
}
