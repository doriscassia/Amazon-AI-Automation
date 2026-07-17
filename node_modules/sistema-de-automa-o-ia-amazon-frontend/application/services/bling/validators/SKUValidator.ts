import { BlingIntegrationContext } from '../types';

export class SKUValidator {
    /**
     * CRITICAL RULE: The SKU must remain exactly the same as the Wedrop SKU.
     * Never modify the SKU.
     */
    validate(context: BlingIntegrationContext): { isValid: boolean; error?: string } {
        if (!context.sku || context.sku.trim() === '') {
            return { isValid: false, error: 'SKU cannot be empty.' };
        }

        if (context.sku !== context.originalWedropSku) {
            return { 
                isValid: false, 
                error: `SKU mismatch. Current SKU (${context.sku}) does not match original Wedrop SKU (${context.originalWedropSku}).` 
            };
        }

        return { isValid: true };
    }
}
